import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
    mutationFn: async (bookId: string) => {
      if (!notebookId) throw new Error('Notebook ID is required');
      
      // Get current selected books
      const { data: notebook, error: fetchError } = await supabase
        .from('notebooks')
        .select('selected_books')
        .eq('id', notebookId)
        .single();

      if (fetchError) throw fetchError;

      const currentBooks = notebook.selected_books || [];
      if (currentBooks.includes(bookId)) {
        throw new Error('Book already added to notebook');
      }

      // Add the book to selected_books array
      const { data, error } = await supabase
        .from('notebooks')
        .update({
          selected_books: [...currentBooks, bookId]
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
    mutationFn: async (bookId: string) => {
      if (!notebookId) throw new Error('Notebook ID is required');
      
      // Get current selected books
      const { data: notebook, error: fetchError } = await supabase
        .from('notebooks')
        .select('selected_books')
        .eq('id', notebookId)
        .single();

      if (fetchError) throw fetchError;

      const currentBooks = notebook.selected_books || [];
      const updatedBooks = currentBooks.filter(id => id !== bookId);

      // Update the selected_books array
      const { data, error } = await supabase
        .from('notebooks')
        .update({
          selected_books: updatedBooks
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
    addBookToNotebook: addBookToNotebook.mutate,
    isAdding: addBookToNotebook.isPending,
    removeBookFromNotebook: removeBookFromNotebook.mutate,
    isRemoving: removeBookFromNotebook.isPending,
  };
};