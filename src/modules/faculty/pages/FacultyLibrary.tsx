import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, BookOpen, Search, Plus, Trash2, UserCheck,
  AlertTriangle, Check, BookMarked, ArrowRightLeft, DollarSign,
  Loader2, X
} from 'lucide-react'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  limit
} from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { useAuth } from '@/modules/auth/context/AuthContext'

// ── Types ──
interface LibraryBook {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  shelf: string
  totalCopies: number
  availableCopies: number
  addedDate: string
  addedBy: string
  description?: string
  collegeId?: string
}

interface IssuedBook {
  id: string
  bookId: string
  bookTitle: string
  studentId: string
  studentName: string
  studentRegNo: string
  issueDate: string
  dueDate: string
  returnDate?: string
  status: 'issued' | 'overdue' | 'returned'
  fine: number
  renewed: number
  collegeId?: string
}

const categories = ['Commerce', 'Management', 'Computer Applications', 'Science', 'Arts & Humanities', 'Languages', 'Education', 'General']

export default function FacultyLibrary() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''

  const [books, setBooks] = useState<LibraryBook[]>([])
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'catalog' | 'issued' | 'issue'>('catalog')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('All')

  // Add Book Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [newBook, setNewBook] = useState<Partial<LibraryBook>>({ category: 'Computer Applications', totalCopies: 1 })
  const [savingBook, setSavingBook] = useState(false)

  // Issue Book Modal
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false)
  const [issueData, setIssueData] = useState<{ bookId: string; studentId: string; studentName: string; studentRegNo: string; dueDate: string }>(
    { bookId: '', studentId: '', studentName: '', studentRegNo: '', dueDate: '' }
  )
  const [issuingBook, setIssuingBook] = useState(false)

  const fetchLibraryData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch Books
      const booksQuery = query(collection(db, 'libraryBooks'), limit(200))
      const booksSnap = await getDocs(booksQuery)
      const loadedBooks: LibraryBook[] = booksSnap.docs.map(docSnap => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
          title: d.title || 'Untitled Book',
          author: d.author || 'Unknown',
          isbn: d.isbn || '',
          category: d.category || 'General',
          shelf: d.shelf || 'Main',
          totalCopies: Number(d.totalCopies) || 1,
          availableCopies: Number(d.availableCopies ?? d.totalCopies ?? 1),
          addedDate: d.addedDate || (d.createdAt?.toDate ? d.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          addedBy: d.addedBy || 'Faculty',
          description: d.description || '',
          collegeId: d.collegeId,
        }
      })

      // 2. Fetch Issued Books
      const issuedQuery = query(collection(db, 'issuedBooks'), limit(150))
      const issuedSnap = await getDocs(issuedQuery)
      const loadedIssued: IssuedBook[] = issuedSnap.docs.map(docSnap => {
        const d = docSnap.data()
        const dueDate = d.dueDate || ''
        const todayStr = new Date().toISOString().split('T')[0]
        const isOverdue = d.status !== 'returned' && dueDate && dueDate < todayStr
        return {
          id: docSnap.id,
          bookId: d.bookId || '',
          bookTitle: d.bookTitle || 'Book',
          studentId: d.studentId || '',
          studentName: d.studentName || 'Student',
          studentRegNo: d.studentRegNo || d.regNo || '',
          issueDate: d.issueDate || todayStr,
          dueDate: d.dueDate || '',
          returnDate: d.returnDate,
          status: d.status === 'returned' ? 'returned' : isOverdue ? 'overdue' : 'issued',
          fine: Number(d.fine) || (isOverdue ? 50 : 0),
          renewed: Number(d.renewed || d.renewals || 0),
          collegeId: d.collegeId,
        }
      })

      setBooks(loadedBooks)
      setIssuedBooks(loadedIssued)
    } catch (err) {
      console.error('[FacultyLibrary] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLibraryData()
  }, [fetchLibraryData])

  // Stats
  const totalBooks = useMemo(() => books.reduce((s, b) => s + b.totalCopies, 0), [books])
  const availableBooks = useMemo(() => books.reduce((s, b) => s + b.availableCopies, 0), [books])
  const activeIssues = useMemo(() => issuedBooks.filter(i => i.status === 'issued').length, [issuedBooks])
  const overdueIssues = useMemo(() => issuedBooks.filter(i => i.status === 'overdue').length, [issuedBooks])
  const totalFine = useMemo(() => issuedBooks.filter(i => i.status === 'overdue').reduce((s, i) => s + i.fine, 0), [issuedBooks])

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.isbn.includes(searchQuery)
      const matchesCategory = filterCategory === 'All' || b.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [books, searchQuery, filterCategory])

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.isbn) return
    setSavingBook(true)
    try {
      const totalCopies = Number(newBook.totalCopies) || 1
      const payload = {
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        isbn: newBook.isbn.trim(),
        category: newBook.category || 'General',
        shelf: newBook.shelf || 'TBD',
        totalCopies,
        availableCopies: totalCopies,
        addedDate: new Date().toISOString().split('T')[0],
        addedBy: user?.name || 'Faculty',
        description: newBook.description || '',
        collegeId: collegeId || null,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'libraryBooks'), payload)
      const createdBook: LibraryBook = {
        id: docRef.id,
        ...payload,
        collegeId: payload.collegeId || undefined,
      }

      setBooks(prev => [createdBook, ...prev])
      setShowAddModal(false)
      setNewBook({ category: 'Computer Applications', totalCopies: 1 })
    } catch (err) {
      console.error('[FacultyLibrary] add book error:', err)
    } finally {
      setSavingBook(false)
    }
  }

  const handleIssueBook = async () => {
    if (!issueData.bookId || !issueData.studentId || !issueData.dueDate) return
    const book = books.find(b => b.id === issueData.bookId)
    if (!book || book.availableCopies <= 0) return

    setIssuingBook(true)
    try {
      const payload = {
        bookId: issueData.bookId,
        bookTitle: book.title,
        studentId: issueData.studentId,
        studentName: issueData.studentName || 'Student',
        studentRegNo: issueData.studentRegNo || issueData.studentId,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: issueData.dueDate,
        status: 'issued',
        fine: 0,
        renewed: 0,
        collegeId: collegeId || null,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'issuedBooks'), payload)
      const newIssue: IssuedBook = {
        id: docRef.id,
        ...payload,
        status: 'issued',
        collegeId: payload.collegeId || undefined,
      }

      const nextAvailable = Math.max(book.availableCopies - 1, 0)
      await updateDoc(doc(db, 'libraryBooks', book.id), { availableCopies: nextAvailable })

      setIssuedBooks(prev => [newIssue, ...prev])
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, availableCopies: nextAvailable } : b))
      setShowIssueModal(false)
      setIssueData({ bookId: '', studentId: '', studentName: '', studentRegNo: '', dueDate: '' })
    } catch (err) {
      console.error('[FacultyLibrary] issue book error:', err)
    } finally {
      setIssuingBook(false)
    }
  }

  const handleReturn = async (issueId: string) => {
    const issue = issuedBooks.find(i => i.id === issueId)
    if (!issue) return

    try {
      const returnDate = new Date().toISOString().split('T')[0]
      await updateDoc(doc(db, 'issuedBooks', issueId), {
        status: 'returned',
        returnDate,
      })

      const book = books.find(b => b.id === issue.bookId)
      if (book) {
        const nextAvailable = Math.min(book.availableCopies + 1, book.totalCopies)
        await updateDoc(doc(db, 'libraryBooks', book.id), { availableCopies: nextAvailable })
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, availableCopies: nextAvailable } : b))
      }

      setIssuedBooks(prev => prev.map(i => i.id === issueId ? { ...i, status: 'returned', returnDate } : i))
    } catch (err) {
      console.error('[FacultyLibrary] return book error:', err)
    }
  }

  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Delete this book from the catalog?')) return
    try {
      await deleteDoc(doc(db, 'libraryBooks', id))
      setBooks(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      console.error('[FacultyLibrary] delete book error:', err)
      setBooks(prev => prev.filter(b => b.id !== id))
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/faculty" className="p-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-teal-400" />
              Library Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Manage books catalog, track issues, and monitor returns</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('issue'); setShowIssueModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium hover:bg-blue-500/25 transition-all text-sm shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Issue Book
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Books', value: totalBooks, icon: <BookOpen className="w-5 h-5 text-teal-400" /> },
          { label: 'Available', value: availableBooks, icon: <BookMarked className="w-5 h-5 text-emerald-400" /> },
          { label: 'Active Issues', value: activeIssues, icon: <UserCheck className="w-5 h-5 text-blue-400" /> },
          { label: 'Overdue', value: overdueIssues, icon: <AlertTriangle className="w-5 h-5 text-rose-400" /> },
          { label: 'Total Fines', value: `₹${totalFine}`, icon: <DollarSign className="w-5 h-5 text-amber-400" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/30">{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['catalog', 'issued', 'issue'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {tab === 'catalog' ? 'Book Catalog' : tab === 'issued' ? 'Issued Books' : 'Issue Book'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading library data...</p>
        </div>
      ) : activeTab === 'catalog' ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500/50 text-sm shadow-sm"
              />
            </div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 cursor-pointer shadow-sm"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map(book => (
              <div key={book.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-medium">
                      {book.category}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base mt-2 truncate">{book.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">by {book.author}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Book"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-700/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/30">
                  <div>
                    <span className="text-slate-400">ISBN:</span> {book.isbn}
                  </div>
                  <div>
                    <span className="text-slate-400">Shelf:</span> {book.shelf}
                  </div>
                  <div>
                    <span className="text-slate-400">Available:</span>{' '}
                    <span className={book.availableCopies > 0 ? 'text-emerald-500 font-bold' : 'text-rose-400 font-bold'}>
                      {book.availableCopies} / {book.totalCopies}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Added:</span> {book.addedDate}
                  </div>
                </div>

                {book.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{book.description}</p>
                )}

                <button
                  disabled={book.availableCopies <= 0}
                  onClick={() => {
                    setIssueData(prev => ({ ...prev, bookId: book.id }))
                    setActiveTab('issue')
                  }}
                  className="w-full py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-medium text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {book.availableCopies > 0 ? 'Issue this Book' : 'Out of Stock'}
                </button>
              </div>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="p-12 text-center bg-white/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-2xl">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">No books found matching criteria</p>
            </div>
          )}
        </>
      ) : activeTab === 'issued' ? (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700/50">
                <tr>
                  <th className="p-4">Book</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Fine</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {issuedBooks.map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{issue.bookTitle}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <div>{issue.studentName}</div>
                      <div className="text-xs text-slate-400 font-mono">{issue.studentRegNo}</div>
                    </td>
                    <td className="p-4 text-slate-500">{issue.issueDate}</td>
                    <td className="p-4 text-slate-500">{issue.dueDate}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        issue.status === 'returned' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                        issue.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-semibold">
                      {issue.fine > 0 ? `₹${issue.fine}` : '—'}
                    </td>
                    <td className="p-4 text-right">
                      {issue.status !== 'returned' && (
                        <button
                          onClick={() => handleReturn(issue.id)}
                          className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-medium hover:bg-teal-600 transition-colors shadow-sm"
                        >
                          Mark Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {issuedBooks.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p>No issued books records</p>
            </div>
          )}
        </div>
      ) : (
        /* Issue Book Tab */
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 max-w-2xl mx-auto shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-teal-400" />
            Issue a Book to Student
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Select Book</label>
              <select
                value={issueData.bookId}
                onChange={e => setIssueData(prev => ({ ...prev, bookId: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
              >
                <option value="">Choose a book...</option>
                {books.filter(b => b.availableCopies > 0).map(b => (
                  <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Student ID</label>
                <input
                  type="text"
                  value={issueData.studentId}
                  onChange={e => setIssueData(prev => ({ ...prev, studentId: e.target.value }))}
                  placeholder="STU2026001"
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Student Name</label>
                <input
                  type="text"
                  value={issueData.studentName}
                  onChange={e => setIssueData(prev => ({ ...prev, studentName: e.target.value }))}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Reg. No</label>
                <input
                  type="text"
                  value={issueData.studentRegNo}
                  onChange={e => setIssueData(prev => ({ ...prev, studentRegNo: e.target.value }))}
                  placeholder="R2026001"
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={issueData.dueDate}
                  onChange={e => setIssueData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleIssueBook}
              disabled={issuingBook || !issueData.bookId || !issueData.studentId || !issueData.dueDate}
              className="w-full px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              {issuingBook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {issuingBook ? 'Issuing...' : 'Issue Book'}
            </button>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                Add New Book
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={newBook.title || ''}
                  onChange={e => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter book title..."
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Author</label>
                  <input
                    type="text"
                    value={newBook.author || ''}
                    onChange={e => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">ISBN</label>
                  <input
                    type="text"
                    value={newBook.isbn || ''}
                    onChange={e => setNewBook(prev => ({ ...prev, isbn: e.target.value }))}
                    placeholder="978-0..."
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                  <select
                    value={newBook.category}
                    onChange={e => setNewBook(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Shelf Location</label>
                  <input
                    type="text"
                    value={newBook.shelf || ''}
                    onChange={e => setNewBook(prev => ({ ...prev, shelf: e.target.value }))}
                    placeholder="CS-A3"
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Total Copies</label>
                <input
                  type="number"
                  min={1}
                  value={newBook.totalCopies || 1}
                  onChange={e => setNewBook(prev => ({ ...prev, totalCopies: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={newBook.description || ''}
                  onChange={e => setNewBook(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 text-sm">
                Cancel
              </button>
              <button
                onClick={handleAddBook}
                disabled={savingBook || !newBook.title || !newBook.author || !newBook.isbn}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {savingBook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingBook ? 'Saving...' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
