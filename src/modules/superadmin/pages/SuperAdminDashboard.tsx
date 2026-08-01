import React from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from '../hooks/useSuperAdmin';
import { useSeedUniversities } from '../../admin/hooks/useUniversities';
import { useNotification } from '../../../shared/providers/NotificationProvider';
import {
  LayoutDashboard, ArrowLeft, Building2, Users, GraduationCap, Shield,
  TrendingUp, Activity, BarChart3, Award, Clock, ArrowUpRight, Database, Loader2
} from "lucide-react";
import type { TopCollege, RecentActivity } from '../types/superAdmin';

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-green-500/10 text-green-400";
    case "inactive": return "bg-slate-500/10 text-slate-400";
    case "suspended": return "bg-red-500/10 text-red-400";
    case "trial": return "bg-blue-500/10 text-blue-400";
    default: return "bg-slate-500/10 text-slate-400";
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "college_created": return Building2;
    case "admin_created": return Shield;
    case "student_imported": return Users;
    case "plan_changed": return BarChart3;
    case "login": return Activity;
    default: return Clock;
  }
};

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const { data, isLoading, error } = useDashboardStats();
  const seedMutation = useSeedUniversities();

  React.useEffect(() => {
    if (error) {
      showError(error.message || "Failed to load dashboard data");
    }
  }, [error, showError]);

  const handleSeedUniversities = async () => {
    if (!confirm("Seed all 23 Karnataka universities to Firestore?\n\nThis will create/update university data for the Vriddhi platform.")) return;
    try {
      const result = await seedMutation.mutateAsync() as { created: number; updated: number; errors: string[] };
showSuccess(`Universities seeded! Created: ${result.created}, Updated: ${result.updated}`);
if (result.errors.length > 0) {
  showError(`${result.errors.length} errors during seed...`);
  console.error("Seed errors:", result.errors);
}
    } catch (err) {
      showError("Seed failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Failed to load dashboard</h2>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-violet-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const recentActivity = data?.recentActivity || [];
  const topColleges = data?.topColleges || [];

  const statCards = [
    { label: "Total Colleges", value: stats?.totalColleges || 0, icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Total Students", value: stats?.totalStudents || 0, icon: Users, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Total Faculty", value: stats?.totalFaculty || 0, icon: GraduationCap, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Total Admins", value: stats?.totalAdmins || 0, icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Active Assessments", value: stats?.activeAssessments || 0, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Recent Imports", value: stats?.recentImports || 0, icon: TrendingUp, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LayoutDashboard className="w-6 h-6 text-teal-400" />
              <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
            </div>
            <p className="text-slate-400 text-sm">Overview of all colleges and system metrics</p>
          </div>
        </div>

        {/* ═══ NEW: Seed Universities Button ═══ */}
        <button
          onClick={handleSeedUniversities}
          disabled={seedMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900/50 disabled:text-teal-400/50 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {seedMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Seeding...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Seed Universities
            </>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Colleges */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Top Performing Colleges</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left px-4 py-3 font-medium">Rank</th>
                  <th className="text-left px-4 py-3 font-medium">College</th>
                  <th className="text-center px-4 py-3 font-medium">Students</th>
                  <th className="text-center px-4 py-3 font-medium">Faculty</th>
                  <th className="text-center px-4 py-3 font-medium">Attendance</th>
                  <th className="text-center px-4 py-3 font-medium">Pass Rate</th>
                  <th className="text-center px-4 py-3 font-medium">Score</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {topColleges.map((college: TopCollege, index: number) => (
                  <tr key={college.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        index === 0 ? "bg-amber-500/20 text-amber-400" :
                        index === 1 ? "bg-slate-400/20 text-slate-300" :
                        index === 2 ? "bg-orange-600/20 text-orange-400" :
                        "bg-slate-700 text-slate-400"
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{college.name}</p>
                        <p className="text-xs text-slate-500">{college.code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-white">{college.students || college.studentCount}</td>
                    <td className="px-4 py-3 text-center text-white">{college.faculty || college.facultyCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${college.avgAttendance >= 90 ? "text-green-400" : "text-yellow-400"}`}>
                        {college.avgAttendance}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${college.passRate >= 90 ? "text-green-400" : "text-yellow-400"}`}>
                        {college.passRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-white font-bold">{college.score}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(college.status || "active")}`}>
                        {college.status || "active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {topColleges.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No colleges ranked yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentActivity.map((activity: RecentActivity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(activity.status || "active")}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{activity.action || activity.description}</p>
                      <p className="text-sm text-slate-400">{activity.target || activity.collegeName || activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{activity.user || activity.userName}</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500">{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      {stats?.planDistribution && Object.keys(stats.planDistribution).length > 0 && (
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Plan Distribution</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.planDistribution).map(([plan, count]) => (
              <div key={plan} className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white capitalize">{count as number}</p>
                <p className="text-xs text-slate-500 capitalize mt-1">{plan}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
