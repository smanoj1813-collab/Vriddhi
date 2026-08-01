import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ChevronRight, Star, Filter, Search, PartyPopper } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: 'academic' | 'cultural' | 'sports' | 'technical' | 'workshop';
  organizer: string;
  registered: boolean;
  maxSeats: number;
  registeredCount: number;
  image?: string;
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Hackathon 2026 - CodeFest',
    description: '24-hour coding competition. Build innovative solutions to real-world problems. Prizes worth ₹1,00,000!',
    date: '2026-07-15',
    time: '09:00 AM',
    venue: 'Main Auditorium',
    category: 'technical',
    organizer: 'CSI Student Chapter',
    registered: true,
    maxSeats: 200,
    registeredCount: 156,
  },
  {
    id: '2',
    title: 'Guest Lecture: AI in Healthcare',
    description: 'Dr. Rajesh Kumar from IIT Delhi will discuss the latest advancements in AI-driven healthcare solutions.',
    date: '2026-07-10',
    time: '02:00 PM',
    venue: 'Seminar Hall B',
    category: 'academic',
    organizer: 'CSE Department',
    registered: false,
    maxSeats: 150,
    registeredCount: 89,
  },
  {
    id: '3',
    title: 'Annual Cultural Fest - Utsav',
    description: 'Three days of music, dance, drama, and fun. Featuring performances by popular artists.',
    date: '2026-08-20',
    time: '10:00 AM',
    venue: 'College Ground',
    category: 'cultural',
    organizer: 'Cultural Committee',
    registered: false,
    maxSeats: 2000,
    registeredCount: 1245,
  },
  {
    id: '4',
    title: 'Inter-College Cricket Tournament',
    description: 'Annual sports meet featuring cricket matches between different colleges.',
    date: '2026-07-25',
    time: '08:00 AM',
    venue: 'Sports Ground',
    category: 'sports',
    organizer: 'Sports Club',
    registered: true,
    maxSeats: 500,
    registeredCount: 320,
  },
  {
    id: '5',
    title: 'Workshop: React & Next.js Masterclass',
    description: 'Hands-on workshop covering advanced React patterns, Next.js 15, and server components.',
    date: '2026-07-05',
    time: '10:00 AM',
    venue: 'Lab Complex - L3',
    category: 'workshop',
    organizer: 'Developer Student Club',
    registered: false,
    maxSeats: 80,
    registeredCount: 72,
  },
  {
    id: '6',
    title: 'Project Exhibition 2026',
    description: 'Showcase your final year projects to industry experts and recruiters.',
    date: '2026-08-05',
    time: '11:00 AM',
    venue: 'Exhibition Hall',
    category: 'academic',
    organizer: 'Project Committee',
    registered: false,
    maxSeats: 300,
    registeredCount: 45,
  },
];

const categoryColors: Record<string, string> = {
  academic: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  cultural: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  sports: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  technical: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  workshop: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

const categoryIcons: Record<string, string> = {
  academic: '📚',
  cultural: '🎭',
  sports: '⚽',
  technical: '💻',
  workshop: '🔧',
};

const categories = ['All', 'academic', 'cultural', 'sports', 'technical', 'workshop'];

export default function StudentEvents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filtered = mockEvents.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const upcoming = filtered.filter(e => new Date(e.date) >= new Date());
  const past = filtered.filter(e => new Date(e.date) < new Date());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-sm text-slate-400">Discover and register for college events</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  selectedCategory === cat
                    ? 'bg-teal-500/15 text-teal-400 border-teal-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                }`}
              >
                {cat === 'All' ? 'All Events' : `${categoryIcons[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-teal-400" />
            Upcoming Events
            <span className="text-sm text-slate-500 font-normal">({upcoming.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {upcoming.map((event, index) => {
                const days = daysUntil(event.date);
                const isExpanded = expandedEvent === event.id;
                const fillPercent = (event.registeredCount / event.maxSeats) * 100;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card rounded-xl border p-5 transition-all ${
                      event.registered
                        ? 'border-teal-500/20 bg-teal-500/5'
                        : 'border-slate-700/30 hover:border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${categoryColors[event.category]}`}>
                          {categoryIcons[event.category]}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white line-clamp-1">{event.title}</h3>
                          <p className="text-xs text-slate-400">{event.organizer}</p>
                        </div>
                      </div>
                      {event.registered && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-400 text-xs font-medium border border-teal-500/20">
                          Registered
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{event.venue}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-sm text-slate-400 mb-3"
                      >
                        {event.description}
                      </motion.p>
                    )}

                    {/* Seats Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">
                          <Users className="w-3 h-3 inline mr-1" />
                          {event.registeredCount}/{event.maxSeats} registered
                        </span>
                        <span className={fillPercent > 80 ? 'text-amber-400' : 'text-slate-500'}>
                          {fillPercent > 80 ? 'Filling fast!' : `${Math.round(fillPercent)}% filled`}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPercent}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full rounded-full ${
                            fillPercent > 90 ? 'bg-red-500' : fillPercent > 70 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                        className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {days <= 7 && days > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium">
                          {days} day{days > 1 ? 's' : ''} left
                        </span>
                      )}

                      {!event.registered && (
                        <button className="px-4 py-1.5 rounded-lg bg-teal-500/15 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-colors border border-teal-500/20">
                          Register
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {upcoming.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No upcoming events</p>
            </div>
          )}
        </div>

        {/* Past Events */}
        {past.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-slate-500" />
              Past Events
              <span className="text-sm text-slate-500 font-normal">({past.length})</span>
            </h2>
            <div className="space-y-3">
              {past.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card rounded-xl border border-slate-800/50 p-4 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center text-lg">
                      {categoryIcons[event.category]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-slate-300">{event.title}</h3>
                      <p className="text-xs text-slate-500">{formatDate(event.date)} · {event.venue}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 text-xs">
                      Completed
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
