
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNotebooks = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: notebooks = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['notebooks', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, returning empty notebooks array');
        return [];
      }
      
      console.log('Fetching notebooks for user:', user.id);
      
      // First get the notebooks
      const { data: notebooksData, error: notebooksError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (notebooksError) {
        console.error('Error fetching notebooks:', notebooksError);
        // Provide more specific error information
        if (notebooksError.message?.includes('fetch')) {
          throw new Error('Unable to connect to Supabase. Please check your internet connection and Supabase configuration.');
        }
        throw notebooksError;
      }

      // Then get book counts separately for each notebook
      const notebooksWithCounts = await Promise.all(
        (notebooksData || []).map(async (notebook) => {
          // Count books that are selected in this notebook (both individual books and genre books)
          const selectedBooks = notebook.selected_books || [];
          const selectedGenres = notebook.selected_genres || [];
          
          // Get count of books from selected genres
          let genreBookCount = 0;
          if (selectedGenres.length > 0) {
            const { data: genreBooks } = await supabase
              .from('books')
              .select('id')
              .in('genre', selectedGenres);
            genreBookCount = genreBooks?.length || 0;
          }
          
          const totalCount = selectedBooks.length + genreBookCount;

          return { ...notebook, sources: [{ count: totalCount }] };
        })
      );

      console.log('Fetched notebooks:', notebooksWithCounts?.length || 0);
      return notebooksWithCounts || [];
    },
    enabled: isAuthenticated && !authLoading,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Set up real-time subscription for notebooks updates
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    console.log('Setting up real-time subscription for notebooks');

    const channel = supabase
      .channel('notebooks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notebooks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time notebook update received:', payload);
          
          // Invalidate and refetch notebooks when any change occurs
          queryClient.invalidateQueries({ queryKey: ['notebooks', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated, queryClient]);

  const createNotebook = useMutation({
    mutationFn: async (notebookData: { title: string; description?: string }) => {
      console.log('Creating notebook with data:', notebookData);
      console.log('Current user:', user?.id);
      
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      // Call the Supabase Edge Function to create notebook via backend
      const { data, error } = await supabase.functions.invoke('create-notebook', {
        body: {
          name: notebookData.title || 'Untitled Notebook',
          user_id: user.id
        }
      });

      if (error) {
        console.error('Error creating notebook via Edge Function:', error);
        throw error;
      }
      
      console.log('Notebook created successfully:', data.notebook);
      return data.notebook;
    },
    onSuccess: (data) => {
      console.log('Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['notebooks', user?.id] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  return {
    notebooks,
    isLoading: authLoading || isLoading,
    error: error?.message || null,
    isError,
    createNotebook: createNotebook.mutate,
    isCreating: createNotebook.isPending,
  };
};
