// src/pages/student/StudentTestDashboard.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Chip, Avatar,
  LinearProgress, Skeleton, Grow, Paper, Divider, Tooltip,
} from "@mui/material";
import {
  PlayArrow, Schedule, CheckCircle, Cancel, Timer,
  TrendingUp, EmojiEvents, Visibility, CalendarToday,
  AccessTime, People, BarChart, ArrowForward, Lock,
  Assessment,
} from "@mui/icons-material";
import { MathRenderer } from '../components/MathRenderer';

const TABS = [
  { key: "upcoming", label: "Upcoming", icon: <Schedule fontSize="small" />, color: "info" },
  { key: "active", label: "Active Now", icon: <PlayArrow fontSize="small" />, color: "success" },
  { key: "completed", label: "Completed", icon: <CheckCircle fontSize="small" />, color: "primary" },
  { key: "missed", label: "Missed", icon: <Cancel fontSize="small" />, color: "error" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ═══════════════════════════════════════════════════════════════
// DEMO DATA — Remove this block after testing
// ═══════════════════════════════════════════════════════════════
const demoTests = [
  {
    id: "demo-001",
    title: "Data Structures & Algorithms — Mid Term",
    subject: "Computer Science",
    status: "scheduled",
    startTime: new Date(Date.now() + 2 * 86400000).toISOString(),
    totalQuestions: 50,
    duration: 120,
    totalMarks: 100,
    totalStudents: 120,
  },
  {
    id: "demo-002",
    title: "Database Management Systems — Quiz 3",
    subject: "DBMS",
    status: "scheduled",
    startTime: new Date(Date.now() + 5 * 86400000).toISOString(),
    totalQuestions: 30,
    duration: 60,
    totalMarks: 20,
    totalStudents: 120,
  },
  {
    id: "demo-003",
    title: "Operating Systems — End Semester",
    subject: "OS",
    status: "active",
    startTime: new Date().toISOString(),
    totalQuestions: 80,
    duration: 180,
    totalMarks: 100,
    totalStudents: 120,
  },
  {
    id: "demo-004",
    title: "Mathematics — Unit Test 1",
    subject: "Mathematics",
    status: "completed",
    startTime: new Date(Date.now() - 7 * 86400000).toISOString(),
    totalQuestions: 25,
    duration: 60,
    totalMarks: 50,
    totalStudents: 120,
  },
  {
    id: "demo-005",
    title: "Computer Networks — Surprise Test",
    subject: "CN",
    status: "missed",
    startTime: new Date(Date.now() - 3 * 86400000).toISOString(),
    totalQuestions: 10,
    duration: 30,
    totalMarks: 15,
    totalStudents: 120,
  },
];

const demoResults = [
  {
    testId: "demo-004",
    testTitle: "Mathematics — Unit Test 1",
    score: 42,
    totalMarks: 50,
    rank: 8,
    completedAt: new Date(Date.now() - 7 * 86400000 + 3600000).toISOString(),
  },
  {
    testId: "demo-005",
    testTitle: "Computer Networks — Surprise Test",
    score: 0,
    totalMarks: 15,
    rank: 95,
    completedAt: new Date(Date.now() - 3 * 86400000 + 1800000).toISOString(),
  },
];
// ═══════════════════════════════════════════════════════════════
// END DEMO DATA
// ═══════════════════════════════════════════════════════════════

const StudentTestDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");

  const tests = demoTests;
  const results = demoResults;
  const loading = false;
  const error = null;

  const filteredTests = tests.filter((t: any) => {
    if (activeTab === "upcoming") return t.status === "scheduled";
    if (activeTab === "active") return t.status === "active";
    if (activeTab === "completed") return t.status === "completed";
    if (activeTab === "missed") return t.status === "missed";
    return false;
  });

  const handleStartTest = (testId: string) => {
    navigate(`/student/assessments/${testId}/instructions`);
  };

  const handleViewResult = (testId: string) => {
    navigate(`/student/assessments/${testId}/result`);
  };

  const handleViewAnalysis = (testId: string) => {
    navigate(`/student/assessments/${testId}/analysis`);
  };

  const handleViewLeaderboard = (testId: string) => {
    navigate(`/student/assessments/${testId}/leaderboard`);
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} />;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          <Assessment sx={{ mr: 1, verticalAlign: "middle" }} />
          My Assessments
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          View upcoming tests, track your progress, and analyze your performance.
        </Typography>
      </Box>

      {/* Stats Row */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
        <StatCard icon={<CheckCircle color="success" />} label="Tests Completed" value={results.length}
          subtitle={`${results.filter((r: any) => r.score >= r.totalMarks * 0.6).length} passed`} />
        <StatCard icon={<TrendingUp color="primary" />} label="Average Score"
          value={`${results.length > 0 ? Math.round(results.reduce((a: any, b: any) => a + (b.score / b.totalMarks) * 100, 0) / results.length) : 0}%`}
          subtitle="Across all tests" />
        <StatCard icon={<EmojiEvents color="warning" />} label="Best Rank"
          value={results.length > 0 ? Math.min(...results.map((r: any) => r.rank)) : "—"}
          subtitle="Highest achieved" />
        <StatCard icon={<Schedule color="info" />} label="Upcoming"
          value={tests.filter((t: any) => t.status === "scheduled").length}
          subtitle="Scheduled tests" />
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: 1, borderBottom: 1, borderColor: "divider", mb: 2, overflowX: "auto" }}>
          {TABS.map((tab: any) => (
            <Button key={tab.key} onClick={() => setActiveTab(tab.key)}
              sx={{
                borderRadius: "8px 8px 0 0", px: 3, py: 1.5, textTransform: "none",
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? `${tab.color}.main` : "text.secondary",
                borderBottom: activeTab === tab.key ? 2 : 0, borderColor: `${tab.color}.main`,
                bgcolor: activeTab === tab.key ? `${tab.color}.main` + "10" : "transparent",
                "&:hover": { bgcolor: `${tab.color}.main` + "08" },
                whiteSpace: "nowrap",
              }}
              startIcon={tab.icon}>
              {tab.label}
              <Chip size="small" label={
                tests.filter((t: any) => {
                  if (tab.key === "upcoming") return t.status === "scheduled";
                  if (tab.key === "active") return t.status === "active";
                  if (tab.key === "completed") return t.status === "completed";
                  if (tab.key === "missed") return t.status === "missed";
                  return false;
                }).length
              } color={tab.color as any} sx={{ ml: 1, height: 20, fontSize: "0.7rem" }} />
            </Button>
          ))}
        </Box>

        {/* Test Cards */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredTests.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            filteredTests.map((test: any, idx: number) => (
              <Grow in key={test.id} timeout={300 + idx * 100}>
                <div>
                  <TestCard test={test} result={results.find((r: any) => r.testId === test.id)}
                    onStart={handleStartTest} onViewResult={handleViewResult}
                    onViewAnalysis={handleViewAnalysis} onViewLeaderboard={handleViewLeaderboard} />
                </div>
              </Grow>
            ))
          )}
        </Box>
      </Box>

      {/* Recent Results & Leaderboard Preview */}
      {results.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 4 }}>
          <Box sx={{ flex: "1 1 400px" }}>
            <RecentResultsCard results={results.slice(0, 5)} onViewResult={handleViewResult} />
          </Box>
          <Box sx={{ flex: "1 1 400px" }}>
            <LeaderboardPreviewCard leaderboard={[
              { rank: 1, studentName: "Rahul Sharma", score: 98, avatar: "" },
              { rank: 2, studentName: "Priya Patel", score: 94, avatar: "" },
              { rank: 3, studentName: "Amit Kumar", score: 91, avatar: "" },
              { rank: 4, studentName: "Sneha Gupta", score: 88, avatar: "" },
              { rank: 5, studentName: "Vikram Rao", score: 85, avatar: "" },
            ]} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ─── Sub-Components ───────────────────────────────────────────

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subtitle: string }> =
  ({ icon, label, value, subtitle }) => (
    <Card sx={{ flex: "1 1 200px", minWidth: 180, borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          {icon}
          <Typography variant="body2" sx={{ color: "text.secondary" }}>{label}</Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>{subtitle}</Typography>
      </CardContent>
    </Card>
  );

const TestCard: React.FC<{
  test: any; result?: any;
  onStart: (id: string) => void; onViewResult: (id: string) => void;
  onViewAnalysis: (id: string) => void; onViewLeaderboard: (id: string) => void;
}> = ({ test, result, onStart, onViewResult, onViewAnalysis, onViewLeaderboard }) => {
  const isActive = test.status === "active";
  const isCompleted = test.status === "completed";
  const isUpcoming = test.status === "scheduled";
  const isMissed = test.status === "missed";

  const getStatusColor = () => {
    if (isActive) return "success"; if (isCompleted) return "primary";
    if (isUpcoming) return "info"; return "error";
  };
  const getStatusLabel = () => {
    if (isActive) return "Active Now"; if (isCompleted) return "Completed";
    if (isUpcoming) return "Upcoming"; return "Missed";
  };

  return (
    <Card sx={{
      borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      border: isActive ? 2 : 1, borderColor: isActive ? "success.main" : "divider",
      transition: "all 0.2s ease",
      "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "flex-start" }}>
          <Box sx={{ flex: "1 1 300px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
              <Chip size="small" label={getStatusLabel()} color={getStatusColor() as any}
                sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
              {test && (
                <Chip size="small" icon={<Lock fontSize="small" />} label="Proctored" variant="outlined" />)}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              <MathRenderer text={test.title} inline />
            </Typography>
            <Typography variant="body2" sx={ { mb: 2, color: "text.secondary" } }>
              {test.subject} • {test.totalQuestions} questions • {test.duration} min
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {new Date(test.startTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {new Date(test.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <People fontSize="small" color="action" />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{test.totalStudents} students</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 200, alignItems: "flex-end" }}>
            {isActive && (
              <Button variant="contained" color="success" size="large" startIcon={<PlayArrow />}
                onClick={() => onStart(test.id)} sx={{ borderRadius: 2, fontWeight: 600, px: 4 }}>
                Start Test
              </Button>
            )}
            {isCompleted && result && (
              <>
                <Box sx={{ textAlign: "right", mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}
                    color={result.score >= test.totalMarks * 0.6 ? "success.main" : "error.main"}>
                    {result.score}/{test.totalMarks}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {Math.round((result.score / test.totalMarks) * 100)}% • Rank #{result.rank}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Button variant="outlined" size="small" startIcon={<Visibility fontSize="small" />}
                    onClick={() => onViewResult(test.id)}>Result</Button>
                  <Button variant="outlined" size="small" startIcon={<BarChart fontSize="small" />}
                    onClick={() => onViewAnalysis(test.id)}>Analysis</Button>
                  <Button variant="outlined" size="small" startIcon={<EmojiEvents fontSize="small" />}
                    onClick={() => onViewLeaderboard(test.id)}>Rank</Button>
                </Box>
              </>
            )}
            {isUpcoming && (
              <Chip icon={<Timer fontSize="small" />} label={`Starts in ${getTimeRemaining(test.startTime)}`}
                color="info" variant="outlined" />
            )}
            {isMissed && (
              <Chip icon={<Cancel fontSize="small" />} label="Missed" color="error" variant="outlined" />)}
          </Box>
        </Box>

        {isCompleted && result && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={(result.score / test.totalMarks) * 100}
              sx={{
                height: 8, borderRadius: 4, bgcolor: "grey.100",
                "& .MuiLinearProgress-bar": {
                  bgcolor: result.score >= test.totalMarks * 0.6 ? "success.main" : "error.main", borderRadius: 4,
                },
              }} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const RecentResultsCard: React.FC<{ results: any[]; onViewResult: (id: string) => void }> =
  ({ results, onViewResult }) => (
    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Recent Results</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {results.map((result: any) => (
            <Box key={result.testId} sx={{
              display: "flex", alignItems: "center", gap: 2, p: 1.5, borderRadius: 2,
              bgcolor: "grey.50", cursor: "pointer", "&:hover": { bgcolor: "grey.100" },
            }} onClick={() => onViewResult(result.testId)}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  <MathRenderer text={result.testTitle} inline />
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {new Date(result.completedAt).toLocaleDateString("en-IN")}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}
                  color={result.score >= result.totalMarks * 0.6 ? "success.main" : "error.main"}>
                  {Math.round((result.score / result.totalMarks) * 100)}%
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Rank #{result.rank}</Typography>
              </Box>
              <ArrowForward fontSize="small" color="action" />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

const LeaderboardPreviewCard: React.FC<{
  leaderboard: Array<{ rank: number; studentName: string; score: number; avatar?: string }>;
}> = ({ leaderboard }) => (
  <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", height: "100%" }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <EmojiEvents color="warning" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Top Performers</Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {leaderboard.map((entry: any, idx: number) => (
          <Box key={idx} sx={{
            display: "flex", alignItems: "center", gap: 2, p: 1.5, borderRadius: 2,
            bgcolor: idx === 0 ? "warning.light" + "20" : "grey.50",
            border: idx === 0 ? 1 : 0, borderColor: "warning.main",
          }}>
            <Typography variant="body2" sx={{
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%",
              bgcolor: idx === 0 ? "warning.main" : idx === 1 ? "grey.400" : idx === 2 ? "orange" : "grey.200",
              color: idx < 3 ? "white" : "text.primary", fontSize: "0.75rem",
            }}>
              {entry.rank}
            </Typography>
            <Avatar src={entry.avatar} sx={{ width: 32, height: 32 }}>{entry.studentName[0]}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.studentName}</Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{entry.score}%</Typography>
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const EmptyState: React.FC<{ tab: TabKey }> = ({ tab }) => {
  const messages: Record<TabKey, { title: string; subtitle: string; icon: React.ReactNode }> = {
    upcoming: { title: "No upcoming tests", subtitle: "You're all caught up! Check back later.",
      icon: <Schedule sx={{ fontSize: 48, color: "text.disabled" }} /> },
    active: { title: "No active tests", subtitle: "No tests currently in progress.",
      icon: <PlayArrow sx={{ fontSize: 48, color: "text.disabled" }} /> },
    completed: { title: "No completed tests", subtitle: "Start with an upcoming assessment!",
      icon: <CheckCircle sx={{ fontSize: 48, color: "text.disabled" }} /> },
    missed: { title: "No missed tests", subtitle: "Great job! You haven't missed any assessments.",
      icon: <Cancel sx={{ fontSize: 48, color: "text.disabled" }} /> },
  };
  const msg = messages[tab];
  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      {msg.icon}
      <Typography variant="h6" sx={ { mt: 2, color: "text.secondary" } }>{msg.title}</Typography>
      <Typography variant="body2" sx={{ color: "text.disabled" }}>{msg.subtitle}</Typography>
    </Box>
  );
};

const DashboardSkeleton: React.FC = () => (
  <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
    <Skeleton variant="text" width={300} height={40} />
    <Skeleton variant="text" width={500} height={20} sx={{ mb: 4 }} />
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
      {[1, 2, 3, 4].map((i: any) => (
        <Skeleton key={i} variant="rounded" height={100} sx={{ flex: "1 1 200px", minWidth: 180 }} />
      ))}
    </Box>
    <Skeleton variant="rounded" height={60} sx={{ mb: 2 }} />
    {[1, 2, 3].map((i: any) => (
      <Skeleton key={i} variant="rounded" height={180} sx={{ mb: 2 }} />
    ))}
  </Box>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <Box sx={{ textAlign: "center", py: 8 }}>
    <Cancel color="error" sx={{ fontSize: 48 }} />
    <Typography variant="h6" color="error" sx={{ mt: 2 }}>Failed to load assessments</Typography>
    <Typography variant="body2" sx={{ color: "text.secondary" }}>{message}</Typography>
  </Box>
);

const getTimeRemaining = (startTime: string): string => {
  const diff = new Date(startTime).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default StudentTestDashboard;