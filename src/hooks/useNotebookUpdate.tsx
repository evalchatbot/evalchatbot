
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNotebookUpdate = () => {
  const queryClient = useQueryClient();

  const updateNotebook = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { title?: string; description?: string } }) => {
      console.log('Updating notebook:', id, updates);
      
      // Map frontend fields to database fields
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.name = updates.title;
      if (updates.description) dbUpdates.memory_summary = updates.description;
      
      const { data, error } = await supabase
        .from('notebooks')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating notebook:', error);
        throw error;
      }
      
      console.log('Notebook updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['notebook', data.id] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  return {
    updateNotebook: updateNotebook.mutate,
    isUpdating: updateNotebook.isPending,
  };
};
