import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedChatMessage, Citation, MessageSegment } from '@/types/message';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

// Type for the expected message structure from n8n_chat_histories
interface N8nMessageFormat {
  type: 'human' | 'ai';
  content: string | {
    segments: Array<{ text: string; citation_id?: number }>;
    citations: Array<{
      citation_id: number;
      source_id: string;
      source_title: string;
      source_type: string;
      page_number?: number;
      chunk_index?: number;
      excerpt?: string;
    }>;
  };
  additional_kwargs?: any;
  response_metadata?: any;
  tool_calls?: any[];
  invalid_tool_calls?: any[];
}

// Type for the AI response structure from n8n
interface N8nAiResponseContent {
  output: Array<{
    text: string;
    citations?: Array<{
      chunk_index: number;
      chunk_source_id: string;
      chunk_lines_from: number;
      chunk_lines_to: number;
    }>;
  }>;
}

const transformMessage = (item: any, sourceMap: Map<string, any>): EnhancedChatMessage => {
  console.log('Processing item:', item);
  
  // Handle the message format based on your JSON examples
  let transformedMessage: EnhancedChatMessage['message'];
  
  // Check if message is an object and has the expected structure
  if (item.message && 
      typeof item.message === 'object' && 
      !Array.isArray(item.message) &&
      'type' in item.message && 
      'content' in item.message) {
    
    // Type assertion with proper checking
    const messageObj = item.message as unknown as N8nMessageFormat;
    
    // Check if this is an AI message with JSON content that needs parsing
    if (messageObj.type === 'ai' && typeof messageObj.content === 'string') {
      try {
        const parsedContent = JSON.parse(messageObj.content) as N8nAiResponseContent;
        
        if (parsedContent.output && Array.isArray(parsedContent.output)) {
          // Transform the parsed content into segments and citations
          const segments: MessageSegment[] = [];
          const citations: Citation[] = [];
          let citationIdCounter = 1;
          
          parsedContent.output.forEach((outputItem) => {
            // Add the text segment
            segments.push({
              text: outputItem.text,
              citation_id: outputItem.citations && outputItem.citations.length > 0 ? citationIdCounter : undefined
            });
            
            // Process citations if they exist
            if (outputItem.citations && outputItem.citations.length > 0) {
              outputItem.citations.forEach((citation) => {
                const sourceInfo = sourceMap.get(citation.chunk_source_id);
                citations.push({
                  citation_id: citationIdCounter,
                  source_id: citation.chunk_source_id,
                  source_title: sourceInfo?.title || 'Unknown Source',
                  source_type: sourceInfo?.type || 'pdf',
                  chunk_lines_from: citation.chunk_lines_from,
                  chunk_lines_to: citation.chunk_lines_to,
                  chunk_index: citation.chunk_index,
                  excerpt: `Lines ${citation.chunk_lines_from}-${citation.chunk_lines_to}`
                });
              });
              citationIdCounter++;
            }
          });
          
          transformedMessage = {
            type: 'ai',
            content: {
              segments,
              citations
            },
            additional_kwargs: messageObj.additional_kwargs,
            response_metadata: messageObj.response_metadata,
            tool_calls: messageObj.tool_calls,
            invalid_tool_calls: messageObj.invalid_tool_calls
          };
        } else {
          // Fallback for AI messages that don't match expected format
          transformedMessage = {
            type: 'ai',
            content: messageObj.content,
            additional_kwargs: messageObj.additional_kwargs,
            response_metadata: messageObj.response_metadata,
            tool_calls: messageObj.tool_calls,
            invalid_tool_calls: messageObj.invalid_tool_calls
          };
        }
      } catch (parseError) {
        console.log('Failed to parse AI content as JSON, treating as plain text:', parseError);
        // If parsing fails, treat as regular string content
        transformedMessage = {
          type: 'ai',
          content: messageObj.content,
          additional_kwargs: messageObj.additional_kwargs,
          response_metadata: messageObj.response_metadata,
          tool_calls: messageObj.tool_calls,
          invalid_tool_calls: messageObj.invalid_tool_calls
        };
      }
    } else {
      // Handle non-AI messages or AI messages that don't need parsing
      transformedMessage = {
        type: messageObj.type === 'human' ? 'human' : 'ai',
        content: messageObj.content || 'Empty message',
        additional_kwargs: messageObj.additional_kwargs,
        response_metadata: messageObj.response_metadata,
        tool_calls: messageObj.tool_calls,
        invalid_tool_calls: messageObj.invalid_tool_calls
      };
    }
  } else if (typeof item.message === 'string') {
    // Handle case where message is just a string
    transformedMessage = {
      type: 'human',
      content: item.message
    };
  } else {
    // Fallback for any other cases
    transformedMessage = {
      type: 'human',
      content: 'Unable to parse message'
    };
  }

  console.log('Transformed message:', transformedMessage);

  return {
    id: item.id,
    session_id: item.session_id,
    message: transformedMessage
  };
};

export const useChatMessages = (notebookId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['chat-messages', notebookId],
    queryFn: async () => {
      if (!notebookId) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      // Also fetch books to get proper book titles
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, author');
      
      const bookMap = new Map(booksData?.map(b => [b.id, { title: b.title, type: 'book' }]) || []);
      
      console.log('Raw data from database:', data);
      console.log('Books map:', bookMap);
      
      // Transform the data to match our expected format
      return data.flatMap((item) => transformDbRowToChatMessages(item, bookMap));
    },
    enabled: !!notebookId && !!user,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Set up Realtime subscription for new messages
  useEffect(() => {
    if (!notebookId || !user) return;

    console.log('Setting up Realtime subscription for notebook:', notebookId);

    const channel = supabase
      .channel('chat-messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `notebook_id=eq.${notebookId}`
        },
        async (payload) => {
          console.log('Realtime: New message received:', payload);
          
          // Fetch books for proper transformation
          const { data: booksData } = await supabase
            .from('books')
            .select('id, title, author');
          
          const bookMap = new Map(booksData?.map(b => [b.id, { title: b.title, type: 'book' }]) || []);
          
          // Transform the new message
          const newMessages = transformDbRowToChatMessages(payload.new, bookMap);
          
          // Update the query cache with the new message
          queryClient.setQueryData(['chat-messages', notebookId], (oldMessages: EnhancedChatMessage[] = []) => {
            // Check if messages already exist to prevent duplicates
            const existingIds = new Set(oldMessages.map(msg => msg.id));
            const newMessagesToAdd = newMessages.filter(msg => !existingIds.has(msg.id));
            
            if (newMessagesToAdd.length === 0) {
              console.log('Messages already exist, skipping');
              return oldMessages;
            }
            
            console.log('Adding new messages to cache:', newMessagesToAdd);
            return [...oldMessages, ...newMessagesToAdd];
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [notebookId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (messageData: {
      notebookId: string;
      role: 'user' | 'assistant';
      content: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Call the Supabase Edge Function to handle the chat
      const { data, error } = await supabase.functions.invoke('send-chat-message', {
        body: {
          notebookId: messageData.notebookId,
          message: messageData.content
        }
      });

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      console.log('Message sent successfully');
    },
  });

  const deleteChatHistory = useMutation({
    mutationFn: async (notebookId: string) => {
      if (!user) throw new Error('User not authenticated');

      console.log('Deleting chat history for notebook:', notebookId);
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('notebook_id', notebookId);

      if (error) {
        console.error('Error deleting chat history:', error);
        throw error;
      }
      
      console.log('Chat history deleted successfully');
      return notebookId;
    },
    onSuccess: (notebookId) => {
      console.log('Chat history cleared for notebook:', notebookId);
      toast({
        title: "Chat history cleared",
        description: "All messages have been deleted successfully.",
      });
      
      // Clear the query data and refetch to confirm
      queryClient.setQueryData(['chat-messages', notebookId], []);
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', notebookId]
      });
    },
    onError: (error) => {
      console.error('Failed to delete chat history:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessage.mutate,
    sendMessageAsync: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
    deleteChatHistory: deleteChatHistory.mutate,
    isDeletingChatHistory: deleteChatHistory.isPending,
  };
};

// Helper function to transform a database row into chat messages
const transformDbRowToChatMessages = (item: any, bookMap: Map<string, any>): EnhancedChatMessage[] => {
  console.log('Processing chat message item:', item);
  
  // Create user message
  const userMessage: EnhancedChatMessage = {
    id: `${item.id}-user`,
    session_id: item.notebook_id,
    message: {
      type: 'human',
      content: item.user_message
    }
  };
  
  // Create assistant message if response exists
  const messages = [userMessage];
  
  if (item.assistant_response) {
    // Try to parse citations if they exist
    let messageContent: string | { segments: MessageSegment[]; citations: Citation[] };
    
    if (item.citations && Array.isArray(item.citations) && item.citations.length > 0) {
      // Transform citations to our expected format
      const transformedCitations: Citation[] = item.citations.map((citation: any, index: number) => ({
        citation_id: index + 1,
        source_id: citation.source_id || '',
        source_title: citation.source_title || 'Unknown Source',
        source_type: citation.source_type || 'book',
        chunk_lines_from: citation.chunk_lines_from,
        chunk_lines_to: citation.chunk_lines_to,
        chunk_index: citation.chunk_index || index,
        excerpt: citation.excerpt
      }));
      
      // Create segments with citations
      const segments: MessageSegment[] = [{
        text: item.assistant_response,
        citation_id: transformedCitations.length > 0 ? 1 : undefined
      }];
      
      messageContent = {
        segments,
        citations: transformedCitations
      };
    } else {
      // Simple string content without citations
      messageContent = item.assistant_response;
    }
    
    const assistantMessage: EnhancedChatMessage = {
      id: `${item.id}-assistant`,
      session_id: item.notebook_id,
      message: {
        type: 'ai',
        content: messageContent
      }
    };
    messages.push(assistantMessage);
  }
  
  return messages;
};