import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
  MapPin, Users, BookOpen, X, AlertCircle,
  Sun
} from 'lucide-react'
// TODO: Fetch from Firebase
const classSessions: any[] = []
const currentFaculty = { name: 'Faculty', department: 'CSE' }

interface CalendarEvent {
  id: string
  title: string
  type: 'class' | 'exam' | 'meeting' | 'deadline' | 'other'
  date: string
  startTime: string
  endTime: string
  room: string
  batch: string
  subject: string
  color: string
}

const eventColors: Record<string, string> = {
  class: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  exam: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  meeting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  deadline: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const eventDotColors: Record<string, string> = {
  class: 'bg-teal-400',
  exam: 'bg-rose-400',
  meeting: 'bg-blue-400',
  deadline: 'bg-amber-400',
  other: 'bg-slate-400',
}

// TODO: Fetch from Firebase
const mockEvents: CalendarEvent[] = []

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function FacultyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 23)) // June 23, 2026
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-06-23')
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [showEventModal, setShowEventModal] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendarDays: { date: number; month: 'prev' | 'current' | 'next'; fullDate: string }[] = []

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    calendarDays.push({ date: d, month: 'prev', fullDate: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ date: d, month: 'current', fullDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }

  // Next month days
  const remaining = 42 - calendarDays.length
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    calendarDays.push({ date: d, month: 'next', fullDate: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }

  const getEventsForDate = (dateStr: string) => mockEvents.filter(e => e.date === dateStr)

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setSelectedDate(todayStr)
  }

  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return {
      dayName: DAYS[d.getDay()],
      date: d.getDate(),
      fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      isToday: d.toDateString() === new Date().toDateString(),
    }
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/faculty" className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-teal-400" />
              Calendar
            </h1>
            <p className="text-slate-400 text-sm">View schedule and manage events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-700/50 transition-all"
          >
            Today
          </button>
          <div className="flex bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 hover:text-white'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 text-sm font-medium transition-all ${viewMode === 'week' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 hover:text-white'}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h2 className="text-xl font-bold text-white">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all"
        >
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const events = getEventsForDate(day.fullDate)
                  const isSelected = selectedDate === day.fullDate
                  const isToday = day.fullDate === new Date().toISOString().split('T')[0]

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day.fullDate)}
                      className={`aspect-square rounded-xl p-1.5 flex flex-col items-center justify-start transition-all relative ${
                        day.month !== 'current'
                          ? 'text-slate-600 hover:bg-slate-800/30'
                          : isSelected
                          ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                          : isToday
                          ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
                          : 'text-slate-300 hover:bg-slate-700/30'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isToday ? 'font-bold' : ''}`}>{day.date}</span>
                      {events.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {events.slice(0, 3).map((e, j) => (
                            <div key={j} className={`w-1.5 h-1.5 rounded-full ${eventDotColors[e.type]}`} />
                          ))}
                          {events.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {Object.entries(eventColors).map(([type, colorClass]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${eventDotColors[type]}`} />
                  <span className="text-xs text-slate-400 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Day Events */}
          <div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-1">
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Select a date'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {selectedDate
                  ? `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`
                  : 'Click a date to view events'}
              </p>

              <div className="space-y-2">
                {selectedEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Sun className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No events scheduled</p>
                  </div>
                ) : (
                  selectedEvents.map(event => (
                    <div key={event.id} className={`p-3 rounded-xl border ${event.color}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${eventDotColors[event.type]}`} />
                        <span className="text-sm font-medium">{event.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs opacity-80">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.startTime} - {event.endTime}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.room}</span>
                        {event.batch !== '-' && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.batch}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events Summary */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 mt-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Upcoming
              </h3>
              <div className="space-y-2">
                {mockEvents
                  .filter(e => new Date(e.date) >= new Date('2026-06-23'))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 4)
                  .map(event => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                      <div className={`w-1 h-8 rounded-full ${eventDotColors[event.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{event.title}</p>
                        <p className="text-xs text-slate-500">{event.date} • {event.startTime}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day, i) => (
                <div key={i} className={`text-center p-3 rounded-xl ${day.isToday ? 'bg-teal-500/10 border border-teal-500/20' : ''}`}>
                  <p className="text-xs text-slate-500">{day.dayName}</p>
                  <p className={`text-lg font-bold ${day.isToday ? 'text-teal-400' : 'text-white'}`}>{day.date}</p>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const dayEvents = getEventsForDate(day.fullDate)
                return (
                  <div key={i} className="min-h-[300px] bg-slate-700/20 rounded-xl p-2 space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-slate-600">No events</p>
                      </div>
                    ) : (
                      dayEvents.map(event => (
                        <div key={event.id} className={`p-2.5 rounded-lg border ${event.color} text-xs`}>
                          <p className="font-medium mb-1">{event.title}</p>
                          <p className="opacity-80">{event.startTime} - {event.endTime}</p>
                          <p className="opacity-60 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {event.room}</p>
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}