import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Check } from 'lucide-react';
import { useAllBooks } from '@/hooks/useAllBooks';
import { useBooks } from '@/hooks/useBooks';

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
  const [searchTerm, setSearchTerm] = useState('');
  const { books: allBooks, isLoading } = useAllBooks();
  const { books: selectedBooks, addBookToNotebook, isAdding } = useBooks(notebookId);

  const selectedBookIds = new Set(selectedBooks?.map(book => book.id) || []);

  const filteredBooks = allBooks.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBook = (bookId: string) => {
    addBookToNotebook(bookId);
  };

  const getGenreColor = (genre: string) => {
    const colors: Record<string, string> = {
      'history': 'bg-amber-100 text-amber-800',
      'science': 'bg-blue-100 text-blue-800',
      'literature': 'bg-purple-100 text-purple-800',
      'philosophy': 'bg-green-100 text-green-800',
      'technology': 'bg-gray-100 text-gray-800',
      'other': 'bg-slate-100 text-slate-800'
    };
    return colors[genre] || colors['other'];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-medium">Add Books to Notebook</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search books by title, author, or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Books List */}
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading books...</p>
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="space-y-3">
                {filteredBooks.map((book) => {
                  const isSelected = selectedBookIds.has(book.id);
                  
                  return (
                    <Card key={book.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">{book.title}</h4>
                            <Badge className={getGenreColor(book.genre)}>
                              {book.genre}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">by {book.author}</p>
                          <p className="text-xs text-gray-500">{book.total_pages} pages</p>
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAddBook(book.id)}
                          disabled={isSelected || isAdding}
                          className="ml-4"
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {searchTerm ? 'No books found matching your search.' : 'No books available.'}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBooksDialog;