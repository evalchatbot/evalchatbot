import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type GenreType = Database['public']['Enums']['genre_type'];

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
        .order('genre', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Group books by genre
  const booksByGenre = books.reduce((acc, book) => {
    if (!acc[book.genre]) {
      acc[book.genre] = [];
    }
    acc[book.genre].push(book);
    return acc;
  }, {} as Record<GenreType, typeof books>);

  // Get all available genres
  const availableGenres = Object.keys(booksByGenre) as GenreType[];
  return {
    books,
    booksByGenre,
    availableGenres,
    isLoading,
    error,
  };
};