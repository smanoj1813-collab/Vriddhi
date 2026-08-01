import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useCollegeComparison,
  useCollegeComparisonTrend,
} from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import {
  BarChart3, TrendingUp, TrendingDown, Minus, ArrowLeft,
  BarChart, Award, AlertTriangle, Download, Filter,
  ChevronDown, ChevronUp, Eye, Calendar, Building2,
  Users, GraduationCap, BookOpen, DollarSign, Target
} from 'lucide-react'
import type { ComparisonFilter, CollegeMetric } from '../api/superAdminApi'

const METRIC_OPTIONS: { value: ComparisonFilter['metric']; label: string; icon: any; unit: string }[] = [
  { value: 'attendance', label: 'Attendance Rate', icon: Users, unit: '%' },
  { value: 'score', label: 'Average Score', icon: Target, unit: '%' },
  { value: 'passRate', label: 'Pass Rate', icon: Award, unit: '%' },
  { value: 'feeCollection', label: 'Fee Collection', icon: DollarSign, unit: '%' },
  { value: 'libraryUsage', label: 'Library Usage', icon: BookOpen, unit: '%' },
  { value: 'placement', label: 'Placement Rate', icon: GraduationCap, unit: '%' },
  { value: 'mentorRatio', label: 'Mentor Ratio', icon: Users, unit: ':1' },
  { value: 'research', label: 'Research Papers', icon: BookOpen, unit: '' },
]

const TIME_RANGES: { value: ComparisonFilter['timeRange']; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
]

const getMetricValue = (college: CollegeMetric, metric: ComparisonFilter['metric']): number => {
  const map: Record<string, keyof CollegeMetric> = {
    attendance: 'avgAttendance', score: 'avgScore', passRate: 'passRate',
    feeCollection: 'feeCollectionRate', libraryUsage: 'libraryUsage',
    placement: 'placementRate', mentorRatio: 'mentorRatio', research: 'researchPapers',
  }
  return college[map[metric] || 'avgAttendance'] as number
}

const getTrendValue = (college: CollegeMetric, metric: ComparisonFilter['metric']): number => {
  const map: Record<string, keyof CollegeMetric> = {
    attendance: 'trendAttendance', score: 'trendScore', passRate: 'trendPassRate',
  }
  return (college[map[metric] || 'trendAttendance'] as number) || 0
}

const getPercentile = (college: CollegeMetric, metric: ComparisonFilter['metric']): number => {
  const map: Record<string, keyof CollegeMetric> = {
    attendance: 'percentileAttendance', score: 'percentileScore', passRate: 'percentilePassRate',
  }
  return (college[map[metric] || 'percentileAttendance'] as number) || 50
}

// Simple bar chart component
const HorizontalBarChart: React.FC<{ data: { label: string; value: number; color: string }[]; maxValue: number; unit: string }> = ({ data, maxValue, unit }) => {
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-300 font-medium">{item.label}</span>
            <span className="text-sm text-slate-400">{item.value.toFixed(1)}{unit}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min((item.value / maxValue) * 100, 100)}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Sparkline component
const Sparkline: React.FC<{ data: { date: string; value: number }[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
  if (!data.length) return <div className="h-10 bg-slate-800 rounded" />
  const min = Math.min(...data.map(d => d.value))
  const max = Math.max(...data.map(d => d.value))
  const range = max - min || 1
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((d.value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      <polygon points={`0,100 ${points} 100,100`} fill={color} fillOpacity="0.1" />
    </svg>
  )
}

const MultiCollegeComparison: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [filters, setFilters] = useState<ComparisonFilter>({ metric: 'attendance', timeRange: '30d' })
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'trend'>('value')
  const [sortDesc, setSortDesc] = useState(true)

  const { data, isLoading, error, refetch } = useCollegeComparison(filters)
  const { data: trendData } = useCollegeComparisonTrend(selectedCollegeId, filters.metric, filters.timeRange)

  const currentMetric = METRIC_OPTIONS.find(m => m.value === filters.metric)!
  const MetricIcon = currentMetric.icon

  const sortedColleges = useMemo(() => {
    if (!data?.colleges) return []
    return [...data.colleges].sort((a, b) => {
      if (sortBy === 'value') {
        const valA = getMetricValue(a, filters.metric)
        const valB = getMetricValue(b, filters.metric)
        return sortDesc ? valB - valA : valA - valB
      }
      else if (sortBy === 'trend') {
        const valA = getTrendValue(a, filters.metric)
        const valB = getTrendValue(b, filters.metric)
        return sortDesc ? valB - valA : valA - valB
      }
      else { // sortBy === 'name'
        // FIX #4: Return localeCompare directly instead of subtracting from 0
        // Old bug: valA = localeCompare(...); valB = 0; then valB - valA (string math)
        return sortDesc
          ? b.collegeName.localeCompare(a.collegeName)
          : a.collegeName.localeCompare(b.collegeName)
      }
    })
  }, [data, sortBy, sortDesc, filters.metric])

  const barChartData = useMemo(() => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#84cc16']
    return sortedColleges.map((c, i) => ({
      label: c.collegeName,
      value: getMetricValue(c, filters.metric),
      color: colors[i % colors.length],
    }))
  }, [sortedColleges, filters.metric])

  const maxBarValue = useMemo(() => Math.max(...barChartData.map(d => d.value), 1), [barChartData])

  const handleExport = () => {
    if (!data) return
    const csv = [
      ['College', 'Code', 'Students', 'Faculty', 'Metric Value', 'Trend', 'Percentile'].join(','),
      ...sortedColleges.map(c => [
        c.collegeName, c.collegeCode, c.students, c.faculty,
        getMetricValue(c, filters.metric).toFixed(2),
        getTrendValue(c, filters.metric).toFixed(2),
        getPercentile(c, filters.metric),
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `college-comparison-${filters.metric}-${filters.timeRange}.csv`
    a.click()
    showSuccess('Comparison data exported')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Failed to load comparison</h2>
          <button onClick={() => refetch()} className="px-4 py-2 bg-violet-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Multi-College Comparison</h1>
            </div>
            <p className="text-slate-400 text-sm">Cross-college analytics and benchmarking</p>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Metric</label>
            <div className="relative">
              <select
                value={filters.metric}
                onChange={e => setFilters(f => ({ ...f, metric: e.target.value as ComparisonFilter['metric'] }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                {METRIC_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Time Range</label>
            <div className="relative">
              <select
                value={filters.timeRange}
                onChange={e => setFilters(f => ({ ...f, timeRange: e.target.value as ComparisonFilter['timeRange'] }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                {TIME_RANGES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Sort By</label>
            <div className="flex gap-2">
              {(['value', 'name', 'trend'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { if (sortBy === s) setSortDesc(!sortDesc); else { setSortBy(s); setSortDesc(true) } }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === s ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {s === 'value' ? 'Score' : s === 'name' ? 'Name' : 'Trend'}
                  {sortBy === s && (sortDesc ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Average</p>
            <p className="text-2xl font-bold text-white">{data.average.toFixed(1)}{currentMetric.unit}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Median</p>
            <p className="text-2xl font-bold text-white">{data.median.toFixed(1)}{currentMetric.unit}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Best</p>
            <p className="text-lg font-bold text-green-400 truncate">{data.best.collegeName}</p>
            <p className="text-sm text-green-400/70">{getMetricValue(data.best, filters.metric).toFixed(1)}{currentMetric.unit}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Std Dev</p>
            <p className="text-2xl font-bold text-white">±{data.stdDev.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">{currentMetric.label} Comparison</h2>
            </div>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">{TIME_RANGES.find(t => t.value === filters.timeRange)?.label}</span>
          </div>
          <HorizontalBarChart data={barChartData} maxValue={maxBarValue} unit={currentMetric.unit} />
        </div>

        {/* Trend Detail */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Trend Detail</h2>
            {selectedCollegeId && (
              <button onClick={() => setSelectedCollegeId(null)} className="text-xs text-slate-400 hover:text-white">Clear</button>
            )}
          </div>
          {selectedCollegeId && trendData ? (
            <div>
              <p className="text-sm text-slate-400 mb-3">
                {sortedColleges.find(c => c.collegeId === selectedCollegeId)?.collegeName}
              </p>
              <Sparkline data={trendData} color="#3b82f6" height={80} />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{trendData[0]?.date}</span>
                <span>{trendData[trendData.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click a college row to view trend</p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Detailed Comparison</h2>
          <p className="text-sm text-slate-400">All metrics across colleges</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left px-4 py-3 font-medium">Rank</th>
                <th className="text-left px-4 py-3 font-medium">College</th>
                <th className="text-center px-4 py-3 font-medium">{currentMetric.label}</th>
                <th className="text-center px-4 py-3 font-medium">Trend</th>
                <th className="text-center px-4 py-3 font-medium">Students</th>
                <th className="text-center px-4 py-3 font-medium">Faculty</th>
                <th className="text-center px-4 py-3 font-medium">Attendance</th>
                <th className="text-center px-4 py-3 font-medium">Pass Rate</th>
                <th className="text-center px-4 py-3 font-medium">Placement</th>
                <th className="text-center px-4 py-3 font-medium">Research</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedColleges.map((college, index) => {
                const metricVal = getMetricValue(college, filters.metric)
                const trend = getTrendValue(college, filters.metric)
                const percentile = getPercentile(college, filters.metric)
                const isBest = index === 0
                const isWorst = index === sortedColleges.length - 1

                return (
                  <tr
                    key={college.collegeId}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                      selectedCollegeId === college.collegeId ? 'bg-blue-500/10' : ''
                    }`}
                    onClick={() => setSelectedCollegeId(college.collegeId)}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        isBest ? 'bg-green-500/20 text-green-400' :
                        isWorst ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{college.collegeName}</p>
                          <p className="text-xs text-slate-500">{college.collegeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-white font-semibold">{metricVal.toFixed(1)}{currentMetric.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {trend > 0.5 ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> :
                         trend < -0.5 ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> :
                         <Minus className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={`text-xs font-medium ${
                          trend > 0.5 ? 'text-green-400' : trend < -0.5 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">{college.students.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{college.faculty}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${
                        college.avgAttendance >= 90 ? 'text-green-400' :
                        college.avgAttendance >= 80 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{college.avgAttendance}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${
                        college.passRate >= 90 ? 'text-green-400' :
                        college.passRate >= 75 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{college.passRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${
                        college.placementRate >= 85 ? 'text-green-400' :
                        college.placementRate >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{college.placementRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">{college.researchPapers}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/superadmin/college/${college.collegeId}`) }}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmark Insights */}
      {data && (
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Benchmark Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Top Performer</span>
              </div>
              <p className="text-white font-semibold">{data.best.collegeName}</p>
              <p className="text-xs text-slate-400 mt-1">
                {getMetricValue(data.best, filters.metric).toFixed(1)}{currentMetric.unit} — {getPercentile(data.best, filters.metric)}th percentile
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Needs Attention</span>
              </div>
              <p className="text-white font-semibold">{data.worst.collegeName}</p>
              <p className="text-xs text-slate-400 mt-1">
                {getMetricValue(data.worst, filters.metric).toFixed(1)}{currentMetric.unit} — {getPercentile(data.worst, filters.metric)}th percentile
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Variance</span>
              </div>
              <p className="text-white font-semibold">±{data.stdDev.toFixed(1)}{currentMetric.unit}</p>
              <p className="text-xs text-slate-400 mt-1">
                {data.stdDev > data.average * 0.1 ? 'High variance — inconsistent performance' : 'Low variance — consistent performance'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiCollegeComparison
