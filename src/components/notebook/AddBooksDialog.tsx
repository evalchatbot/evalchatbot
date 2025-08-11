import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, BookOpen, Library } from 'lucide-react';
import { useAllBooks } from '@/hooks/useAllBooks';
import { useBooks } from '@/hooks/useBooks';
import { Database } from '@/integrations/supabase/types';

type GenreType = Database['public']['Enums']['genre_type'];

interface AddBooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId?: string;
}

const AddBooksDialog = ({
  open,
  onOpenChange,
  notebookId
}: AddBooksDialogProps) => {
  const { booksByGenre, availableGenres, isLoading } = useAllBooks();
  const { books: selectedBooks, addBooksToNotebook, isAdding } = useBooks(notebookId);
  const [selectedGenres, setSelectedGenres] = useState<Set<GenreType>>(new Set());
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());

  // Get currently selected books and genres from the notebook
  const currentlySelectedBookIds = new Set(selectedBooks?.map(book => book.id) || []);

  const handleGenreToggle = (genre: GenreType) => {
    const newSelectedGenres = new Set(selectedGenres);
    const genreBooks = booksByGenre[genre] || [];
    const genreBookIds = genreBooks.map(book => book.id);

    if (selectedGenres.has(genre)) {
      // Remove genre and its books
      newSelectedGenres.delete(genre);
      const newSelectedBooks = new Set(selectedBookIds);
      genreBookIds.forEach(id => newSelectedBooks.delete(id));
      setSelectedBookIds(newSelectedBooks);
    } else {
      // Add genre and its books
      newSelectedGenres.add(genre);
      const newSelectedBooks = new Set(selectedBookIds);
      genreBookIds.forEach(id => newSelectedBooks.add(id));
      setSelectedBookIds(newSelectedBooks);
    }
    
    setSelectedGenres(newSelectedGenres);
  };

  const handleBookToggle = (bookId: string, genre: GenreType) => {
    const newSelectedBooks = new Set(selectedBookIds);
    const newSelectedGenres = new Set(selectedGenres);
    
    if (selectedBookIds.has(bookId)) {
      // Remove book
      newSelectedBooks.delete(bookId);
      
      // Check if this was the last book from this genre
      const genreBooks = booksByGenre[genre] || [];
      const remainingGenreBooks = genreBooks.filter(book => 
        book.id !== bookId && newSelectedBooks.has(book.id)
      );
      
      if (remainingGenreBooks.length === 0) {
        newSelectedGenres.delete(genre);
      }
    } else {
      // Add book
      newSelectedBooks.add(bookId);
      
      // Check if all books from this genre are now selected
      const genreBooks = booksByGenre[genre] || [];
      const allGenreBooksSelected = genreBooks.every(book => 
        book.id === bookId || newSelectedBooks.has(book.id)
      );
      
      if (allGenreBooksSelected) {
        newSelectedGenres.add(genre);
      }
    }
    
    setSelectedBookIds(newSelectedBooks);
    setSelectedGenres(newSelectedGenres);
  };

  const handleAddToNotebook = () => {
    const bookIdsToAdd = Array.from(selectedBookIds).filter(id => !currentlySelectedBookIds.has(id));
    const genresToAdd = Array.from(selectedGenres);
    
    if (bookIdsToAdd.length > 0 || genresToAdd.length > 0) {
      addBooksToNotebook({ 
        bookIds: bookIdsToAdd.length > 0 ? bookIdsToAdd : undefined,
        genres: genresToAdd.length > 0 ? genresToAdd : undefined
      });
      
      // Reset selections and close dialog
      setSelectedBookIds(new Set());
      setSelectedGenres(new Set());
      onOpenChange(false);
    }
  };

  const getGenreDisplayName = (genre: GenreType) => {
    const displayNames: Record<GenreType, string> = {
      'history': 'History',
      'science': 'Science',
      'literature': 'Literature',
      'philosophy': 'Philosophy',
      'technology': 'Technology',
      'other': 'Other'
    };
    return displayNames[genre] || genre;
  };

  const getGenreColor = (genre: GenreType) => {
    const colors: Record<GenreType, string> = {
      'history': 'bg-amber-100 text-amber-800 border-amber-200',
      'science': 'bg-blue-100 text-blue-800 border-blue-200',
      'literature': 'bg-purple-100 text-purple-800 border-purple-200',
      'philosophy': 'bg-green-100 text-green-800 border-green-200',
      'technology': 'bg-gray-100 text-gray-800 border-gray-200',
      'other': 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[genre] || colors['other'];
  };

  const totalNewSelections = selectedBookIds.size;
  const isGenreFullySelected = (genre: GenreType) => selectedGenres.has(genre);
  const isBookAlreadyInNotebook = (bookId: string) => currentlySelectedBookIds.has(bookId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-medium">Add Books to Notebook</DialogTitle>
          <p className="text-sm text-gray-600">
            Select books by genre or individually. You can mix books from different genres.
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading books...</p>
            </div>
          ) : availableGenres.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {availableGenres.map((genre) => {
                  const genreBooks = booksByGenre[genre] || [];
                  const isGenreSelected = isGenreFullySelected(genre);
                  const selectedBooksInGenre = genreBooks.filter(book => selectedBookIds.has(book.id)).length;
                  const booksAlreadyInNotebook = genreBooks.filter(book => isBookAlreadyInNotebook(book.id)).length;
                  
                  return (
                    <div key={genre} className="space-y-3">
                      {/* Genre Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Library className="h-5 w-5 text-gray-600" />
                          <h3 className="text-lg font-medium text-gray-900">
                            {getGenreDisplayName(genre)}
                          </h3>
                          <Badge className={getGenreColor(genre)}>
                            {genreBooks.length} books
                          </Badge>
                        </div>
                        
                        <Button
                          variant={isGenreSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleGenreToggle(genre)}
                          disabled={isAdding || genreBooks.every(book => isBookAlreadyInNotebook(book.id))}
                        >
                          {isGenreSelected ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Genre Selected
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Select All
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Books in Genre */}
                      <div className="grid grid-cols-1 gap-2 ml-8">
                        {genreBooks.map((book) => {
                          const isSelected = selectedBookIds.has(book.id);
                          const isAlreadyInNotebook = isBookAlreadyInNotebook(book.id);
                          
                          return (
                            <Card 
                              key={book.id} 
                              className={`p-3 border cursor-pointer transition-colors ${
                                isSelected ? 'border-blue-300 bg-blue-50' : 
                                isAlreadyInNotebook ? 'border-green-300 bg-green-50' :
                                'border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => !isAlreadyInNotebook && handleBookToggle(book.id, genre)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <BookOpen className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">{book.title}</h4>
                                    <p className="text-sm text-gray-600 truncate">by {book.author}</p>
                                    <p className="text-xs text-gray-500">{book.total_pages} pages</p>
                                  </div>
                                </div>
                                
                                <div className="flex-shrink-0">
                                  {isAlreadyInNotebook ? (
                                    <div className="flex items-center text-green-600">
                                      <Check className="h-4 w-4 mr-1" />
                                      <span className="text-xs">Added</span>
                                    </div>
                                  ) : isSelected ? (
                                    <div className="flex items-center text-blue-600">
                                      <Check className="h-4 w-4 mr-1" />
                                      <span className="text-xs">Selected</span>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookToggle(book.id, genre);
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No books available in the database.</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {totalNewSelections > 0 && (
                <span>{totalNewSelections} new book{totalNewSelections !== 1 ? 's' : ''} selected</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddToNotebook}
                disabled={totalNewSelections === 0 || isAdding}
              >
                {isAdding ? 'Adding...' : `Add ${totalNewSelections} Book${totalNewSelections !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBooksDialog;