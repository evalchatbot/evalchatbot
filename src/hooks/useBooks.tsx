import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type GenreType = Database['public']['Enums']['genre_type'];

export const useBooks = (notebookId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: books = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['books', notebookId],
    queryFn: async () => {
      if (!notebookId) return [];
      
      // Get the notebook to see which books are selected
      const { data: notebook, error: notebookError } = await supabase
        .from('notebooks')
        .select('selected_books')
        .eq('id', notebookId)
        .single();

      if (notebookError) throw notebookError;
      
      if (!notebook.selected_books || notebook.selected_books.length === 0) {
        return [];
      }

      // Get the actual book data for selected books
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .in('id', notebook.selected_books);

      if (error) throw error;
      return data;
    },
    enabled: !!notebookId,
  });

  const addBookToNotebook = useMutation({
    mutationFn: async ({ bookIds, genres }: { bookIds?: string[], genres?: GenreType[] }) => {
      if (!notebookId) throw new Error('Notebook ID is required');
      
      // Get current selected books
      const { data: notebook, error: fetchError } = await supabase
        .from('notebooks')
        .select('selected_books, selected_genres')
        .eq('id', notebookId)
        .single();

      if (fetchError) throw fetchError;

      const currentBooks = notebook.selected_books || [];
      const currentGenres = notebook.selected_genres || [];
      
      let updatedBooks = [...currentBooks];
      let updatedGenres = [...currentGenres];
      
      // Add individual books if provided
      if (bookIds) {
        const newBooks = bookIds.filter(id => !currentBooks.includes(id));
        updatedBooks = [...updatedBooks, ...newBooks];
      }
      
      // Add genres if provided
      if (genres) {
        const newGenres = genres.filter(genre => !currentGenres.includes(genre));
        updatedGenres = [...updatedGenres, ...newGenres];
      }

      const { data, error } = await supabase
        .from('notebooks')
        .update({
          selected_books: updatedBooks,
          selected_genres: updatedGenres
        })
        .eq('id', notebookId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', notebookId] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });

  const removeBookFromNotebook = useMutation({
    mutationFn: async ({ bookId, genre }: { bookId?: string, genre?: GenreType }) => {
      if (!notebookId) throw new Error('Notebook ID is required');
      
      // Get current selected books
      const { data: notebook, error: fetchError } = await supabase
        .from('notebooks')
        .select('selected_books, selected_genres')
        .eq('id', notebookId)
        .single();

      if (fetchError) throw fetchError;

      const currentBooks = notebook.selected_books || [];
      const currentGenres = notebook.selected_genres || [];
      
      let updatedBooks = [...currentBooks];
      let updatedGenres = [...currentGenres];
      
      if (bookId) {
        updatedBooks = currentBooks.filter(id => id !== bookId);
      }
      
      if (genre) {
        updatedGenres = currentGenres.filter(g => g !== genre);
      }

      const { data, error } = await supabase
        .from('notebooks')
        .update({
          selected_books: updatedBooks,
          selected_genres: updatedGenres
        })
        .eq('id', notebookId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', notebookId] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });

  return {
    books,
    isLoading,
    error,
    addBooksToNotebook: addBookToNotebook.mutate,
    isAdding: addBookToNotebook.isPending,
    removeFromNotebook: removeBookFromNotebook.mutate,
    isRemoving: removeBookFromNotebook.isPending,
  };
};