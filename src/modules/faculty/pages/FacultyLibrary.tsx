import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, BookOpen, Search, Plus, Trash2, Edit3, UserCheck,
  AlertTriangle, Clock, X, Check, BookMarked, ArrowRightLeft, DollarSign
} from 'lucide-react'

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
}

// ── Mock Data ──
// TODO: Fetch from Firebase
const mockBooks: LibraryBook[] = []

// TODO: Fetch from Firebase
const mockIssued: IssuedBook[] = []

const categories = ['Computer Science', 'Mathematics', 'Electronics', 'Physics', 'Chemistry', 'Mechanical', 'Civil', 'General']

export default function FacultyLibrary() {
  const [books, setBooks] = useState<LibraryBook[]>(mockBooks)
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>(mockIssued)
  const [activeTab, setActiveTab] = useState<'catalog' | 'issued' | 'issue'>('catalog')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('All')

  // Add Book Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [newBook, setNewBook] = useState<Partial<LibraryBook>>({ category: 'Computer Science', totalCopies: 1 })

  // Issue Book Modal
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false)
  const [issueData, setIssueData] = useState<{ bookId: string; studentId: string; studentName: string; studentRegNo: string; dueDate: string }>(
    { bookId: '', studentId: '', studentName: '', studentRegNo: '', dueDate: '' }
  )

  // Stats
  const totalBooks = books.reduce((s: number, b: LibraryBook) => s + b.totalCopies, 0)
  const availableBooks = books.reduce((s: number, b: LibraryBook) => s + b.availableCopies, 0)
  const activeIssues = issuedBooks.filter((i: IssuedBook) => i.status === 'issued').length
  const overdueIssues = issuedBooks.filter((i: IssuedBook) => i.status === 'overdue').length
  const totalFine = issuedBooks.filter((i: IssuedBook) => i.status === 'overdue').reduce((s: number, i: IssuedBook) => s + i.fine, 0)

  const filteredBooks = books.filter((b: LibraryBook) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.isbn.includes(searchQuery)
    const matchesCategory = filterCategory === 'All' || b.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || !newBook.isbn) return
    const book: LibraryBook = {
      id: `BK${Date.now()}`,
      title: newBook.title,
      author: newBook.author,
      isbn: newBook.isbn,
      category: newBook.category || 'General',
      shelf: newBook.shelf || 'TBD',
      totalCopies: newBook.totalCopies || 1,
      availableCopies: newBook.totalCopies || 1,
      addedDate: new Date().toISOString().split('T')[0],
      addedBy: 'Faculty',
      description: newBook.description,
    }
    setBooks((prev: LibraryBook[]) => [book, ...prev])
    setShowAddModal(false)
    setNewBook({ category: 'Computer Science', totalCopies: 1 })
  }

  const handleIssueBook = () => {
    if (!issueData.bookId || !issueData.studentId || !issueData.dueDate) return
    const book = books.find((b: LibraryBook) => b.id === issueData.bookId)
    if (!book || book.availableCopies <= 0) return

    const issue: IssuedBook = {
      id: `I${Date.now()}`,
      bookId: issueData.bookId,
      bookTitle: book.title,
      studentId: issueData.studentId,
      studentName: issueData.studentName,
      studentRegNo: issueData.studentRegNo,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: issueData.dueDate,
      status: 'issued',
      fine: 0,
      renewed: 0,
    }

    setIssuedBooks((prev: IssuedBook[]) => [issue, ...prev])
    setBooks((prev: LibraryBook[]) => prev.map((b: LibraryBook) => b.id === issueData.bookId ? { ...b, availableCopies: b.availableCopies - 1 } : b))
    setShowIssueModal(false)
    setIssueData({ bookId: '', studentId: '', studentName: '', studentRegNo: '', dueDate: '' })
  }

  const handleReturn = (issueId: string) => {
    const issue = issuedBooks.find((i: IssuedBook) => i.id === issueId)
    if (!issue) return

    setIssuedBooks((prev: IssuedBook[]) => prev.map((i: IssuedBook) => i.id === issueId ? { ...i, status: 'returned' as const, returnDate: new Date().toISOString().split('T')[0] } : i))
    setBooks((prev: LibraryBook[]) => prev.map((b: LibraryBook) => b.id === issue.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b))
  }

  const handleDeleteBook = (id: string) => {
    if (!window.confirm('Delete this book? All copies will be removed from the catalog.')) return
    setBooks((prev: LibraryBook[]) => prev.filter((b: LibraryBook) => b.id !== id))
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/faculty" className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Library Management</h1>
            <p className="text-slate-400 text-sm">Manage books, track issues, and monitor overdue returns</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('issue'); setShowIssueModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 font-medium hover:bg-blue-500/25 transition-all text-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Issue Book
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all text-sm"
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
          { label: 'Overdue', value: overdueIssues, icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
          { label: 'Total Fines', value: `₹${totalFine}`, icon: <DollarSign className="w-5 h-5 text-amber-400" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-700/30">{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs">{stat.label}</p>
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
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {tab === 'catalog' ? 'Book Catalog' : tab === 'issued' ? 'Issued Books' : 'Issue Book'}
          </button>
        ))}
      </div>

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 text-sm"
              />
            </div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white appearance-none focus:outline-none focus:border-teal-500/50 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBooks.map((book: LibraryBook) => (
              <div key={book.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/30 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{book.title}</h3>
                      <p className="text-xs text-slate-400">{book.author}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteBook(book.id)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
                  <div><span className="text-slate-500">ISBN:</span> {book.isbn}</div>
                  <div><span className="text-slate-500">Shelf:</span> {book.shelf}</div>
                  <div><span className="text-slate-500">Category:</span> {book.category}</div>
                  <div><span className="text-slate-500">Added:</span> {book.addedDate}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                      book.availableCopies > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Out of Stock'}
                    </span>
                    <span className="text-xs text-slate-500">of {book.totalCopies} total</span>
                  </div>
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No books found</p>
            </div>
          )}
        </>
      )}

      {/* Issued Books Tab */}
      {activeTab === 'issued' && (
        <div className="space-y-3">
          {issuedBooks.map((issue: IssuedBook) => (
            <div key={issue.id} className={`bg-slate-800/50 border rounded-2xl p-5 ${
              issue.status === 'overdue' ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700/50'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    issue.status === 'overdue' ? 'bg-red-500/15' : issue.status === 'returned' ? 'bg-slate-700/30' : 'bg-teal-500/15'
                  }`}>
                    {issue.status === 'overdue' ? (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    ) : issue.status === 'returned' ? (
                      <Check className="w-5 h-5 text-slate-400" />
                    ) : (
                      <UserCheck className="w-5 h-5 text-teal-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{issue.bookTitle}</h3>
                    <p className="text-xs text-slate-400">{issue.studentName} · {issue.studentRegNo}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Issued: {issue.issueDate}</div>
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {issue.dueDate}</div>
                  {issue.returnDate && <div className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Returned: {issue.returnDate}</div>}
                  {issue.fine > 0 && <div className="flex items-center gap-1 text-red-400 font-medium"><DollarSign className="w-3.5 h-3.5" /> Fine: ₹{issue.fine}</div>}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                    issue.status === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    issue.status === 'returned' ? 'bg-slate-700/50 text-slate-400 border-slate-600/30' :
                    'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  }`}>
                    {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                  </span>
                  {issue.status !== 'returned' && (
                    <button
                      onClick={() => handleReturn(issue.id)}
                      className="px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-400 text-xs font-medium hover:bg-teal-500/25 transition-colors border border-teal-500/20"
                    >
                      Mark Returned
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {issuedBooks.length === 0 && (
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No issued books</p>
            </div>
          )}
        </div>
      )}

      {/* Issue Book Tab */}
      {activeTab === 'issue' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Issue a Book</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Select Book</label>
              <select
                value={issueData.bookId}
                onChange={e => {
                  setIssueData((prev: typeof issueData) => ({ ...prev, bookId: e.target.value }))
                }}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
              >
                <option value="">Choose a book...</option>
                {books.filter((b: LibraryBook) => b.availableCopies > 0).map((b: LibraryBook) => (
                  <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Student ID</label>
                <input
                  type="text"
                  value={issueData.studentId}
                  onChange={e => setIssueData((prev: typeof issueData) => ({ ...prev, studentId: e.target.value }))}
                  placeholder="STU2024001"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Student Name</label>
                <input
                  type="text"
                  value={issueData.studentName}
                  onChange={e => setIssueData((prev: typeof issueData) => ({ ...prev, studentName: e.target.value }))}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Reg. No</label>
                <input
                  type="text"
                  value={issueData.studentRegNo}
                  onChange={e => setIssueData((prev: typeof issueData) => ({ ...prev, studentRegNo: e.target.value }))}
                  placeholder="R2024001"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={issueData.dueDate}
                  onChange={e => setIssueData((prev: typeof issueData) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleIssueBook}
              disabled={!issueData.bookId || !issueData.studentId || !issueData.dueDate}
              className="w-full px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Issue Book
            </button>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Book</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={newBook.title || ''}
                  onChange={e => setNewBook((prev: Partial<LibraryBook>) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter book title..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Author</label>
                  <input
                    type="text"
                    value={newBook.author || ''}
                    onChange={e => setNewBook((prev: Partial<LibraryBook>) => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">ISBN</label>
                  <input
                    type="text"
                    value={newBook.isbn || ''}
                    onChange={e => setNewBook((prev: Partial<LibraryBook>) => ({ ...prev, isbn: e.target.value }))}
                    placeholder="978-0..."
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Category</label>
                  <select
                    value={newBook.category}
                    onChange={e => setNewBook((prev: Partial<LibraryBook>) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Shelf Location</label>
                  <input
                    type="text"
                    value={newBook.shelf || ''}
                    onChange={e => setNewBook((prev: Partial<LibraryBook>) => ({ ...prev, shelf: e.target.value }))}
                    placeholder="CS-A3"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Total Copies</label>
                <input
                  type="number"
                  min={1}
                  value={newBook.totalCopies || 1}
                  onChange={e => setNewBook((prev: Partial<LibraryBook>) => ({ ...prev, totalCopies: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={newBook.description || ''}
                  onChange={e => setNewBook((prev: Partial<LibraryBook>) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-all text-sm">
                Cancel
              </button>
              <button
                onClick={handleAddBook}
                disabled={!newBook.title || !newBook.author || !newBook.isbn}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Add Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}