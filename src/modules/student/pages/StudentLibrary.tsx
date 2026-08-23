import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Calendar, AlertTriangle, CheckCircle, Clock, Library,
  Filter, BookMarked, RefreshCw
} from 'lucide-react';
import { db } from '@/Firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';

// ─── Types ───────────────────────────────────────────────────────────

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  shelf: string;
}

export interface IssuedBook {
  id: string;
  bookId: string;
  bookTitle: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'overdue' | 'returned';
  fine: number;
  renewals: number;
}

// ─── API Layer ───────────────────────────────────────────────────────

const MAX_READS = 500;
let readCount = 0;

function trackRead(n: number) {
  readCount += n;
  if (readCount > MAX_READS) console.warn('[LibraryApi] Read cap exceeded');
}

export async function fetchLibraryBooks(): Promise<LibraryBook[]> {
  if (readCount >= MAX_READS) return [];
  const q = query(collection(db, 'libraryBooks'), limit(200));
  const snap = await getDocs(q);
  trackRead(snap.size);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as LibraryBook))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function fetchIssuedBooks(studentId: string): Promise<IssuedBook[]> {
  if (readCount >= MAX_READS) return [];
  const q = query(
    collection(db, 'issuedBooks'),
    where('studentId', '==', studentId),
    limit(50)
  );
  const snap = await getDocs(q);
  trackRead(snap.size);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as IssuedBook))
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

// ─── Hook ──────────────────────────────────────────────────────────

function useLibraryData(studentId: string) {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [booksData, issuedData] = await Promise.all([
        fetchLibraryBooks(),
        fetchIssuedBooks(studentId),
      ]);
      setBooks(booksData);
      setIssuedBooks(issuedData);
    } catch (err: any) {
      console.error('[useLibraryData] Fetch error:', err);
      setError(err.message || 'Failed to load library data');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return { loading, books, issuedBooks, error, refresh };
}

// ─── Page Component ─────────────────────────────────────────────────

export default function StudentLibrary() {
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);
  const studentId = profile?.id || user?.uid || '';
  const { loading, books, issuedBooks, refresh } = useLibraryData(studentId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'catalog' | 'issued'>('catalog');

  // Debounced search (300ms sweet spot)
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categories = ['All', ...Array.from(new Set(books.map((b) => b.category)))];

  const filteredBooks = books.filter((b) => {
    const q = debouncedQuery.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.includes(q);
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeBooks = issuedBooks.filter((i) => i.status !== 'returned');
  const overdueBooks = activeBooks.filter((i) => i.status === 'overdue');
  const totalFine = overdueBooks.reduce((sum, b) => sum + b.fine, 0);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Library</h1>
          <p className="text-xs md:text-sm text-slate-400">
            Search books, check availability, and manage issued books
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-700/30 bg-slate-800/50 p-3 md:p-4"
        >
          <Library className="w-4 h-4 md:w-5 md:h-5 text-teal-400 mb-2" />
          <p className="text-xl md:text-2xl font-bold text-white">{books.length}</p>
          <p className="text-xs text-slate-400">Total Books</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-700/30 bg-slate-800/50 p-3 md:p-4"
        >
          <BookMarked className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mb-2" />
          <p className="text-xl md:text-2xl font-bold text-white">{activeBooks.length}</p>
          <p className="text-xs text-slate-400">Issued to You</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-700/30 bg-slate-800/50 p-3 md:p-4"
        >
          <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400 mb-2" />
          <p className="text-xl md:text-2xl font-bold text-white">{overdueBooks.length}</p>
          <p className="text-xs text-slate-400">Overdue</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-700/30 bg-slate-800/50 p-3 md:p-4"
        >
          <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400 mb-2" />
          <p className="text-xl md:text-2xl font-bold text-white">&#8377;{totalFine}</p>
          <p className="text-xs text-slate-400">Total Fine</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 md:mb-6">
        {(['catalog', 'issued'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab === 'catalog' ? 'Book Catalog' : 'My Issued Books'}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white appearance-none focus:outline-none focus:border-teal-500/50 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <AnimatePresence>
              {filteredBooks.map((book, index: number) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-slate-700/30 bg-slate-800/50 p-4 md:p-5 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{book.title}</h3>
                        <p className="text-xs text-slate-400">{book.author}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium border shrink-0 ${
                        book.available
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {book.available ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
                    <div>
                      <span className="text-slate-500">ISBN:</span> {book.isbn}
                    </div>
                    <div>
                      <span className="text-slate-500">Shelf:</span> {book.shelf}
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span> {book.category}
                    </div>
                    <div>
                      <span className="text-slate-500">Copies:</span>{' '}
                      {book.availableCopies}/{book.totalCopies}
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{
                        width: `${book.totalCopies > 0 ? (book.availableCopies / book.totalCopies) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredBooks.length === 0 && !loading && (
            <div className="text-center py-12 md:py-16">
              <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No books found</p>
              <p className="text-sm text-slate-500">Try adjusting your search</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {loading ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400">Loading your library records...</p>
            </div>
          ) : issuedBooks.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No books issued</p>
              <p className="text-sm text-slate-500">Visit the catalog to issue books</p>
            </div>
          ) : (
            issuedBooks.map((book, index: number) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl border p-4 md:p-5 ${
                  book.status === 'overdue'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-slate-700/30 bg-slate-800/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        book.status === 'overdue' ? 'bg-red-500/15' : 'bg-teal-500/15'
                      }`}
                    >
                      {book.status === 'overdue' ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-teal-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{book.bookTitle}</h3>
                      <p className="text-xs text-slate-400">Book ID: {book.bookId}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 md:gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Issued: {book.issueDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span
                        className={
                          book.status === 'overdue' ? 'text-red-400 font-medium' : ''
                        }
                      >
                        Due: {book.dueDate}
                      </span>
                    </div>
                    {book.returnDate && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Returned: {book.returnDate}</span>
                      </div>
                    )}
                    {book.fine > 0 && (
                      <div className="flex items-center gap-1.5 text-red-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Fine: &#8377;{book.fine}</span>
                      </div>
                    )}
                    {book.renewals > 0 && (
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renewed {book.renewals}x</span>
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium border shrink-0 ${
                      book.status === 'overdue'
                        ? 'bg-red-500/15 text-red-400 border-red-500/20'
                        : book.status === 'returned'
                        ? 'bg-slate-700/50 text-slate-400 border-slate-600/30'
                        : 'bg-teal-500/15 text-teal-400 border-teal-500/20'
                    }`}
                  >
                    {book.status === 'overdue'
                      ? 'Overdue'
                      : book.status === 'returned'
                      ? 'Returned'
                      : 'Active'}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
