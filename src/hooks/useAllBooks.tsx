import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAllBooks = () => {
  const { user } = useAuth();

  const {
    data: books = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['all-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    books,
    isLoading,
    error,
  };
};