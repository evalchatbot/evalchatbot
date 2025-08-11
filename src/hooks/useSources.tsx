import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSources = (notebookId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get books that are selected in this notebook
  const { data: sources, isLoading } = useQuery({
    queryKey: ['notebook-books', notebookId],
    queryFn: async () => {
      if (!notebookId) return [];

      // First get the notebook to see which books are selected
      const { data: notebook, error: notebookError } = await supabase
        .from('notebooks')
        .select('selected_books, selected_genres')
        .eq('id', notebookId)
        .single();

      if (notebookError) throw notebookError;

      if (!notebook) return [];

      // Get all books that match either the selected books or selected genres
      let query = supabase.from('books').select('*');
      
      const conditions = [];
      
      // Add condition for individually selected books
      if (notebook.selected_books && notebook.selected_books.length > 0) {
        conditions.push(`id.in.(${notebook.selected_books.join(',')})`);
      }
      
      // Add condition for selected genres
      if (notebook.selected_genres && notebook.selected_genres.length > 0) {
        conditions.push(`genre.in.(${notebook.selected_genres.join(',')})`);
      }
      
      if (conditions.length === 0) return [];
      
      // Use OR to combine conditions
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .or(conditions.join(','))
        .order('created_at', { ascending: false });

      if (error) throw error;

      return books || [];
    },
    enabled: !!notebookId,
  });

  const removeFromNotebook = useMutation({
    mutationFn: async ({ bookId }: { bookId: string }) => {
      if (!notebookId) throw new Error('No notebook ID provided');

      // Get current notebook data
      const { data: notebook, error: fetchError } = await supabase
        .from('notebooks')
        .select('selected_books, selected_genres')
        .eq('id', notebookId)
        .single();

      if (fetchError) throw fetchError;

      // Remove the book from selected_books array
      const updatedBooks = (notebook.selected_books || []).filter(id => id !== bookId);

      // Update the notebook
      const { error: updateError } = await supabase
        .from('notebooks')
        .update({ selected_books: updatedBooks })
        .eq('id', notebookId);

      if (updateError) throw updateError;

      return { bookId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebook-books', notebookId] });
      toast({
        title: "Book removed",
        description: "The book has been removed from this notebook.",
      });
    },
    onError: (error) => {
      console.error('Error removing book from notebook:', error);
      toast({
        title: "Error",
        description: "Failed to remove book from notebook. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    sources,
    isLoading,
    removeFromNotebook: removeFromNotebook.mutate,
    isRemoving: removeFromNotebook.isPending,
  };
};