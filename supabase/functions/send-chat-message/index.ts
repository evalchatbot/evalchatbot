import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notebookId, message } = await req.json();
    
    console.log('Received chat message:', { notebookId, message });

    if (!notebookId || !message) {
      throw new Error('notebookId and message are required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the notebook to find selected books and user_id
    const { data: notebook, error: notebookError } = await supabase
      .from('notebooks')
      .select('selected_books, selected_genres, user_id')
      .eq('id', notebookId)
      .single();

    if (notebookError) {
      throw new Error(`Failed to fetch notebook: ${notebookError.message}`);
    }

    // Get book IDs from both selected_books and selected_genres
    let allBookIds = notebook.selected_books || [];
    
    if (notebook.selected_genres && notebook.selected_genres.length > 0) {
      const { data: genreBooks, error: genreBooksError } = await supabase
        .from('books')
        .select('id')
        .in('genre', notebook.selected_genres);
      
      if (!genreBooksError && genreBooks) {
        const genreBookIds = genreBooks.map(book => book.id);
        allBookIds = [...new Set([...allBookIds, ...genreBookIds])];
      }
    }

    console.log('Found book IDs for context:', allBookIds);

    // Call your backend API
    const backendResponse = await fetch('https://evalchatbot-backend.onrender.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        notebook_id: notebookId,
        user_id: notebook.user_id
      })
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend API error:', backendResponse.status, errorText);
      throw new Error(`Backend API error: ${backendResponse.status}`);
    }

    const backendData = await backendResponse.json();
    console.log('Backend response:', backendData);

    // Save the chat message to the database
    const { data: chatMessage, error: chatError } = await supabase
      .from('chat_messages')
      .insert({
        notebook_id: notebookId,
        user_message: message,
        assistant_response: backendData.response || backendData.message || 'No response',
        citations: backendData.citations || null
      })
      .select()
      .single();

    if (chatError) {
      console.error('Error saving chat message:', chatError);
      throw new Error(`Failed to save chat message: ${chatError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: chatMessage,
        response: backendData
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in send-chat-message:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process chat message' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});