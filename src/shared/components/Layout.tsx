import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth, type UserRole } from '../../modules/auth/context/AuthContext';
import { useThemeMode } from "../contexts/ThemeProvider";
import { useTranslation } from "../contexts/LanguageProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import type { TranslationKey } from "../i18n";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  People,
  School,
  Assessment,
  Settings,
  ExitToApp,
  Assignment,
  CalendarToday,
  TrendingUp,
  QuestionAnswer,
  Description,
  AdminPanelSettings,
  SupervisedUserCircle,
  Business,
  UploadFile,
  PersonAdd,
  ManageAccounts,
  AttachMoney,
  BarChart as BarChartIcon,
  CreditCard as CreditCardIcon,
  MonitorHeart as MonitorHeartIcon,
  LightMode,
  DarkMode,
  AccountBalance,
  CheckCircle,
  AutoAwesome,
  Campaign,
  FolderZip,
  NotificationsNone,
  SwapHoriz,
  ExpandMore,
  RateReview,
} from "@mui/icons-material";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/Firebase/config';

const DRAWER_EXPANDED_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 76;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: number;
  section?: string;
}

const NAV_LABEL_KEYS: Record<string, TranslationKey> = {
  Dashboard: "nav.dashboard",
  Colleges: "nav.colleges",
  Universities: "nav.universities",
  "Create College": "nav.createCollege",
  Admins: "nav.admins",
  "Create Admin": "nav.createAdmin",
  "Manage Faculty": "nav.manageFaculty",
  "Import Faculty": "nav.importFaculty",
  "Manage Students": "nav.manageStudents",
  "Import Students": "nav.importStudents",
  Curriculum: "nav.curriculum",
  Comparison: "nav.comparison",
  Billing: "nav.billing",
  "System Health": "nav.systemHealth",
  Students: "nav.students",
  "360° View": "nav.view360",
  Attendance: "nav.attendance",
  Assessments: "nav.assessments",
  "Question Bank": "nav.questionBank",
  "Question Review": "nav.questionReview",
  "AI Question Generator": "nav.aiQuestionGenerator",
  "Paper Generator": "nav.paperGenerator",
  "Class Schedule": "nav.classSchedule",
  "Fee Management": "nav.feeManagement",
  Analytics: "nav.analytics",
  Journey: "nav.journey",
  Settings: "nav.settings",
  "HOD Dashboard": "nav.hodDashboard",
  "Department Students": "nav.departmentStudents",
  "Mark Attendance": "nav.markAttendance",
  "My Attendance": "nav.myAttendance",
  "My Curriculum": "nav.myCurriculum",
  Topics: "nav.topics",
  Assignments: "nav.assignments",
  "Upload Material": "nav.uploadMaterial",
  "Generated Papers": "nav.generatedPapers",
  "Student Analysis": "nav.studentAnalysis",
  "Reschedule Class": "nav.rescheduleClass",
  Announcements: "nav.announcements",
  Calendar: "nav.calendar",
  "Mentored Students": "nav.mentoredStudents",
  "Attendance Overview": "nav.attendanceOverview",
};

const navItems: NavItem[] = [
  // ─── SUPER ADMIN ───
  { label: "Dashboard", path: "/superadmin/dashboard", icon: <Dashboard fontSize="small" />, roles: ["superadmin"], section: "Overview" },
  { label: "Colleges", path: "/superadmin/colleges", icon: <Business fontSize="small" />, roles: ["superadmin"], section: "Institutions" },
  { label: "Universities", path: "/superadmin/universities", icon: <AccountBalance fontSize="small" />, roles: ["superadmin"], section: "Institutions" },
  { label: "Create College", path: "/superadmin/colleges/new", icon: <PersonAdd fontSize="small" />, roles: ["superadmin"], section: "Institutions" },
  { label: "Admins", path: "/superadmin/admins", icon: <SupervisedUserCircle fontSize="small" />, roles: ["superadmin"], section: "User Management" },
  { label: "Create Admin", path: "/superadmin/admins/new", icon: <AdminPanelSettings fontSize="small" />, roles: ["superadmin"], section: "User Management" },
  { label: "Manage Faculty", path: "/superadmin/faculty", icon: <People fontSize="small" />, roles: ["superadmin"], section: "User Management" },
  { label: "Import Faculty", path: "/superadmin/faculty/import", icon: <UploadFile fontSize="small" />, roles: ["superadmin"], section: "User Management" },
  { label: "Manage Students", path: "/superadmin/students", icon: <ManageAccounts fontSize="small" />, roles: ["superadmin"], section: "User Management" },
  { label: "Import Students", path: "/superadmin/students/import", icon: <UploadFile fontSize="small" />, roles: ["superadmin"], section: "User Management" },
  { label: "Curriculum", path: "/superadmin/curriculum", icon: <School fontSize="small" />, roles: ["superadmin"], section: "Academic" },
  { label: "Comparison", path: "/superadmin/comparison", icon: <BarChartIcon fontSize="small" />, roles: ["superadmin"], section: "System" },
  { label: "Billing", path: "/superadmin/billing", icon: <CreditCardIcon fontSize="small" />, roles: ["superadmin"], section: "System" },
  { label: "System Health", path: "/superadmin/health", icon: <MonitorHeartIcon fontSize="small" />, roles: ["superadmin"], section: "System" },

  // ─── ADMIN / PRINCIPAL ───
  { label: "Dashboard", path: "/admin/dashboard", icon: <Dashboard fontSize="small" />, roles: ["admin", "principal"], section: "Main" },
  { label: "Students", path: "/admin/students", icon: <People fontSize="small" />, roles: ["admin", "principal"], section: "Academic" },
  { label: "360° View", path: "/admin/view360", icon: <Assessment fontSize="small" />, roles: ["admin", "principal"], section: "Academic" },
  { label: "Attendance", path: "/admin/attendance", icon: <CalendarToday fontSize="small" />, roles: ["admin", "principal"], section: "Academic" },
  { label: "Assessments", path: "/admin/assessments", icon: <Assignment fontSize="small" />, roles: ["admin", "principal"], section: "Academic" },
  { label: "Grade Records", path: "/admin/grade-records", icon: <Assessment fontSize="small" />, roles: ["admin", "principal"], section: "Academic" },
  { label: "Question Bank", path: "/admin/question-bank", icon: <QuestionAnswer fontSize="small" />, roles: ["admin", "principal"], section: "Assessment Tools" },
  { label: "Question Review", path: "/admin/review-queue", icon: <RateReview fontSize="small" />, roles: ["admin", "principal"], section: "Assessment Tools" },
  { label: "Paper Review", path: "/admin/paper-review", icon: <Description fontSize="small" />, roles: ["admin", "principal"], section: "Assessment Tools" },
  { label: "AI Question Generator", path: "/admin/ai-questions", icon: <AutoAwesome fontSize="small" />, roles: ["admin", "principal"], section: "Assessment Tools" },
  { label: "Paper Generator", path: "/admin/paper-generator", icon: <Description fontSize="small" />, roles: ["admin", "principal"], section: "Assessment Tools" },
  { label: "Class Schedule", path: "/admin/class-schedule", icon: <CalendarToday fontSize="small" />, roles: ["admin", "principal"], section: "Operations" },
  { label: "Curriculum", path: "/admin/curriculum", icon: <School fontSize="small" />, roles: ["admin", "principal"], section: "Operations" },
  { label: "Fee Management", path: "/admin/fee-management", icon: <AttachMoney fontSize="small" />, roles: ["admin", "principal"], section: "Finance" },
  { label: "Analytics", path: "/admin/analytics", icon: <BarChartIcon fontSize="small" />, roles: ["admin", "principal"], section: "Insights" },
  { label: "Journey", path: "/admin/journey", icon: <TrendingUp fontSize="small" />, roles: ["admin", "principal"], section: "Insights" },
  { label: "Settings", path: "/admin/settings", icon: <Settings fontSize="small" />, roles: ["admin", "principal"], section: "Settings" },

  // ─── HOD ───
  { label: "HOD Dashboard", path: "/admin/hod-dashboard", icon: <Dashboard fontSize="small" />, roles: ["hod"], section: "Main" },
  { label: "Department Students", path: "/admin/students", icon: <People fontSize="small" />, roles: ["hod"], section: "Academic" },
  { label: "360° View", path: "/admin/view360", icon: <Assessment fontSize="small" />, roles: ["hod"], section: "Academic" },
  { label: "Attendance", path: "/admin/attendance", icon: <CalendarToday fontSize="small" />, roles: ["hod"], section: "Academic" },
  { label: "Assessments", path: "/admin/assessments", icon: <Assignment fontSize="small" />, roles: ["hod"], section: "Academic" },
  { label: "Grade Records", path: "/admin/grade-records", icon: <Assessment fontSize="small" />, roles: ["hod"], section: "Academic" },
  { label: "Question Bank", path: "/admin/question-bank", icon: <QuestionAnswer fontSize="small" />, roles: ["hod"], section: "Assessment Tools" },
  { label: "Paper Review", path: "/admin/paper-review", icon: <Description fontSize="small" />, roles: ["hod"], section: "Assessment Tools" },
  { label: "AI Question Generator", path: "/admin/ai-questions", icon: <AutoAwesome fontSize="small" />, roles: ["hod"], section: "Assessment Tools" },
  { label: "Paper Generator", path: "/admin/paper-generator", icon: <Description fontSize="small" />, roles: ["hod"], section: "Assessment Tools" },
  { label: "Class Schedule", path: "/admin/class-schedule", icon: <CalendarToday fontSize="small" />, roles: ["hod"], section: "Operations" },
  { label: "Curriculum", path: "/admin/curriculum", icon: <School fontSize="small" />, roles: ["hod"], section: "Operations" },
  { label: "Analytics", path: "/admin/analytics", icon: <BarChartIcon fontSize="small" />, roles: ["hod"], section: "Insights" },
  { label: "Journey", path: "/admin/journey", icon: <TrendingUp fontSize="small" />, roles: ["hod"], section: "Insights" },

  // ─── FACULTY ───
  { label: "Dashboard", path: "/faculty/dashboard", icon: <Dashboard fontSize="small" />, roles: ["faculty"], section: "Overview" },
  { label: "Mark Attendance", path: "/faculty/attendance-marking", icon: <CheckCircle fontSize="small" />, roles: ["faculty"], section: "Attendance" },
  { label: "My Attendance", path: "/faculty/attendance", icon: <CalendarToday fontSize="small" />, roles: ["faculty"], section: "Attendance" },
  { label: "My Curriculum", path: "/faculty/curriculum", icon: <School fontSize="small" />, roles: ["faculty"], section: "Teaching" },
  { label: "Topics", path: "/faculty/topics", icon: <School fontSize="small" />, roles: ["faculty"], section: "Teaching" },
  { label: "Assignments", path: "/faculty/assignments", icon: <Assignment fontSize="small" />, roles: ["faculty"], section: "Teaching" },
  { label: "Upload Material", path: "/faculty/upload-material", icon: <UploadFile fontSize="small" />, roles: ["faculty"], section: "Teaching" },
  { label: "Question Bank", path: "/faculty/question-bank", icon: <QuestionAnswer fontSize="small" />, roles: ["faculty"], section: "Assessments" },
  { label: "AI Question Generator", path: "/faculty/ai-questions", icon: <AutoAwesome fontSize="small" />, roles: ["faculty"], section: "Assessments" },
  { label: "Generated Papers", path: "/faculty/papers", icon: <Description fontSize="small" />, roles: ["faculty"], section: "Assessments" },
  { label: "Assessments", path: "/faculty/assessments", icon: <Assignment fontSize="small" />, roles: ["faculty"], section: "Assessments" },
  { label: "Student Analysis", path: "/faculty/student-analysis", icon: <Assessment fontSize="small" />, roles: ["faculty"], section: "Insights" },
  { label: "360° View", path: "/faculty/view360", icon: <Assessment fontSize="small" />, roles: ["faculty"], section: "Insights" },
  { label: "Reschedule Class", path: "/faculty/reschedule", icon: <CalendarToday fontSize="small" />, roles: ["faculty"], section: "Schedule" },
  { label: "Announcements", path: "/faculty/announcements", icon: <Campaign fontSize="small" />, roles: ["faculty"], section: "Communication" },
  { label: "Calendar", path: "/faculty/calendar", icon: <CalendarToday fontSize="small" />, roles: ["faculty"], section: "Schedule" },
  { label: "Settings", path: "/faculty/settings", icon: <Settings fontSize="small" />, roles: ["faculty"], section: "Settings" },

  // ─── HOD ─── additional settings
  { label: "Settings", path: "/admin/settings", icon: <Settings fontSize="small" />, roles: ["hod"], section: "Settings" },

  // ─── MENTOR ───
  { label: "Dashboard", path: "/faculty/dashboard", icon: <Dashboard fontSize="small" />, roles: ["mentor"], section: "Overview" },
  { label: "Mentored Students", path: "/faculty/student-analysis", icon: <People fontSize="small" />, roles: ["mentor"], section: "Students" },
  { label: "360° View", path: "/faculty/view360", icon: <Assessment fontSize="small" />, roles: ["mentor"], section: "Students" },
  { label: "Attendance Overview", path: "/faculty/attendance", icon: <CalendarToday fontSize="small" />, roles: ["mentor"], section: "Attendance" },
  { label: "Settings", path: "/faculty/settings", icon: <Settings fontSize="small" />, roles: ["mentor"], section: "Settings" },
];

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { resolvedMode, toggleMode } = useThemeMode();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('vriddhi-sidebar-collapsed') === 'true';
  });
  const [collegeName, setCollegeName] = useState<string>('');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('vriddhi-sidebar-collapsed', String(next));
  };

  useEffect(() => {
    const loadCollegeName = async () => {
      if (!user?.collegeId) {
        setCollegeName('');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'colleges', user.collegeId));
        if (snap.exists()) {
          const data = snap.data();
          setCollegeName(data.name || data.shortName || data.collegeName || '');
        }
      } catch (err) {
        console.error('[Layout] Failed to fetch college name:', err);
      }
    };
    loadCollegeName();
  }, [user?.collegeId]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
    navigate("/login");
  };

  const effectiveRole = user?.role || "admin";

  const filteredNav = React.useMemo(() => {
    const seen = new Set<string>();
    return navItems
      .filter(item => item.roles.includes(effectiveRole))
      .filter(item => {
        if (seen.has(item.path)) return false;
        seen.add(item.path);
        return true;
      });
  }, [effectiveRole]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin": return { bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", label: t("role.superadmin") };
      case "admin": return { bg: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300", label: t("role.admin") };
      case "principal": return { bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300", label: t("role.principal") };
      case "hod": return { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", label: t("role.hod") };
      case "mentor": return { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", label: t("role.mentor") };
      case "faculty": return { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", label: t("role.faculty") };
      default: return { bg: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200", label: role };
    }
  };

  const currentRoleInfo = getRoleBadgeColor(effectiveRole);

  const drawerWidth = collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_EXPANDED_WIDTH;

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      {/* Brand Header */}
      <Box
        sx={{
          height: 64,
          px: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
            <School sx={{ color: "#ffffff", fontSize: 22 }} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-600 to-teal-800 dark:from-teal-400 dark:to-teal-200 bg-clip-text text-transparent leading-tight">
                Vriddhi
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                {t("brand.subtitle")}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <IconButton
            size="small"
            onClick={toggleCollapse}
            sx={{
              color: "text.secondary",
              bgcolor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              '&:hover': { bgcolor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            }}
          >
            {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* College & Profile Mini-Banner */}
      {!collapsed && (
        <Box
          sx={{
            p: 2,
            mx: 1.5,
            my: 1.5,
            borderRadius: 2.5,
            bgcolor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(13, 148, 136, 0.04)',
            border: '1px solid',
            borderColor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(13, 148, 136, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            src={user?.avatar || undefined}
            sx={{
              width: 38,
              height: 38,
              bgcolor: 'primary.main',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)',
            }}
          >
            {user?.name?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "text.primary", fontSize: '0.85rem' }}>
              {user?.name || user?.displayName || 'Faculty User'}
            </Typography>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${currentRoleInfo.bg}`}>
                {currentRoleInfo.label}
              </span>
            </div>
            {collegeName && (
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5, fontSize: '11px', fontWeight: 500 }} noWrap>
                {collegeName}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Navigation Links */}
      <List sx={{ flex: 1, overflowY: "auto", px: 1, py: 1 }}>
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/admin" && item.path !== "/faculty" && item.path !== "/superadmin" && location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? (NAV_LABEL_KEYS[item.label] ? t(NAV_LABEL_KEYS[item.label]) : item.label) : ""} placement="right" arrow>
                <ListItemButton
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    justifyContent: collapsed ? "center" : "flex-start",
                    px: collapsed ? 1.5 : 2,
                    py: 1,
                    minHeight: 44,
                    transition: 'all 0.15s ease',
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "#ffffff",
                      boxShadow: "0 2px 8px rgba(13, 148, 136, 0.25)",
                      "&:hover": { bgcolor: "primary.dark" },
                      "& .MuiListItemIcon-root": { color: "#ffffff" },
                      "& .MuiTypography-root": { fontWeight: 600 },
                    },
                    "&:hover": {
                      bgcolor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? "auto" : 36,
                      color: isActive ? "#ffffff" : "text.secondary",
                      justifyContent: "center",
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "#ffffff" : "text.primary",
                          }}
                        >
                          {NAV_LABEL_KEYS[item.label] ? t(NAV_LABEL_KEYS[item.label]) : item.label}
                        </Typography>
                      }
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Footer / Controls */}
      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <ListItemButton
          onClick={toggleMode}
          sx={{
            borderRadius: 2,
            justifyContent: collapsed ? "center" : "flex-start",
            px: collapsed ? 1.5 : 2,
            py: 0.8,
            color: "text.secondary",
            "&:hover": { bgcolor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? "auto" : 36, color: "text.secondary", justifyContent: "center" }}>
            {resolvedMode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {resolvedMode === "dark" ? t("common.lightMode") : t("common.darkMode")}
                </Typography>
              }
            />
          )}
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            justifyContent: collapsed ? "center" : "flex-start",
            px: collapsed ? 1.5 : 2,
            py: 0.8,
            color: "error.main",
            "&:hover": { bgcolor: "error.light", opacity: 0.15 },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? "auto" : 36, color: "error.main", justifyContent: "center" }}>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {t("common.signOut")}
                </Typography>
              }
            />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ─── Top App Bar ─── */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)",
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ height: 64, px: { xs: 2, sm: 3 } }}>
          {/* Mobile menu toggle */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Breadcrumb / Title */}
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t("role.portal", { role: currentRoleInfo.label })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                  {collegeName || t("brand.academicManagement")}
                </span>
              </div>
            </div>
          </Box>

          {/* Right Header Utilities */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LanguageSwitcher compact showLabel={false} className="hidden sm:inline-flex" />
            {/* Theme toggle */}
            <Tooltip title={resolvedMode === "dark" ? t("common.lightMode") : t("common.darkMode")}>
              <IconButton onClick={toggleMode} color="inherit" size="small" sx={{ p: 1 }}>
                {resolvedMode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Portal Switch Links */}
            <Link
              to="/student/dashboard"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800 transition-colors"
            >
              <School fontSize="inherit" />
              {t("nav.studentView")}
            </Link>

            {/* User Profile avatar menu */}
            <IconButton
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              size="small"
              sx={{ ml: 0.5 }}
            >
              <Avatar
                src={user?.avatar || undefined}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "primary.main",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {user?.name?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1.5,
                    minWidth: 220,
                    borderRadius: 3,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid',
                    borderColor: 'divider',
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {user?.name || user?.displayName || "User"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {user?.email || "Academic User"}
                </Typography>
                <div className="mt-2">
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${currentRoleInfo.bg}`}>
                    {currentRoleInfo.label}
                  </span>
                </div>
              </Box>
              <Divider />
              <MenuItem onClick={() => {
                setUserMenuAnchor(null);
                if (effectiveRole === 'faculty' || effectiveRole === 'mentor') navigate('/faculty/settings');
                else if (effectiveRole === 'hod') navigate('/admin/settings');
                else navigate('/admin/settings');
              }}>
                <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                <ListItemText primary="Settings" />
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                <ListItemIcon sx={{ color: "error.main" }}><ExitToApp fontSize="small" /></ListItemIcon>
                <ListItemText primary={t("common.signOut")} />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Drawer Navigation ─── */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_EXPANDED_WIDTH,
              bgcolor: "background.paper",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid",
              borderColor: "divider",
              overflowX: "hidden",
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* ─── Main Content Area ─── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          pt: "64px", // Top bar offset
          bgcolor: "background.default",
          overflow: "auto",
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children || <Outlet />}
        </div>
      </Box>
    </Box>
  );
};

export default Layout;
