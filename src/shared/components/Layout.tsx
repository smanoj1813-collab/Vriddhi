import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../modules/auth/context/AuthContext';
import { useThemeMode } from "../contexts/ThemeProvider";
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
} from "@mui/material";
import {
  Menu as MenuIcon,
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
  AutoFixHigh,
  CheckCircle,
} from "@mui/icons-material";

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION ITEMS — SPLIT BY ROLE
// ═══════════════════════════════════════════════════════════════════════

const navItems: NavItem[] = [
  // ── SUPER ADMIN ─────────────────────────────────────────────────────
  { label: "Dashboard", path: "/superadmin", icon: <Dashboard />, roles: ["superadmin"] },
  { label: "Colleges", path: "/superadmin/colleges", icon: <Business />, roles: ["superadmin"] },
  { label: "Universities", path: "/superadmin/universities", icon: <AccountBalance />, roles: ["superadmin"] },
  { label: "Create College", path: "/superadmin/colleges/create", icon: <PersonAdd />, roles: ["superadmin"] },
  { label: "Admins", path: "/superadmin/admins", icon: <SupervisedUserCircle />, roles: ["superadmin"] },
  { label: "Create Admin", path: "/superadmin/create-admin", icon: <AdminPanelSettings />, roles: ["superadmin"] },
  { label: "Curriculum", path: "/superadmin/curriculum", icon: <School />, roles: ["superadmin"] },
  { label: "Manage Students", path: "/superadmin/students", icon: <ManageAccounts />, roles: ["superadmin"] },
  { label: "Import Users", path: "/superadmin/user-import", icon: <UploadFile />, roles: ["superadmin"] },
  { label: "Comparison", path: "/superadmin/comparison", icon: <BarChartIcon />, roles: ["superadmin"] },
  { label: "Billing", path: "/superadmin/billing", icon: <CreditCardIcon />, roles: ["superadmin"] },
  { label: "Health", path: "/superadmin/health", icon: <MonitorHeartIcon />, roles: ["superadmin"] },
  { label: "Import Faculty", path: "/superadmin/faculty-import", icon: <School />, roles: ["superadmin"] },
  { label: "Manage Faculty", path: "/superadmin/faculty", icon: <People />, roles: ["superadmin"] },

  // ── PRINCIPAL (admin) — FULL COLLEGE CONTROL ──────────────────────
  { label: "Dashboard", path: "/admin", icon: <Dashboard />, roles: ["admin"] },
  { label: "Students", path: "/students", icon: <People />, roles: ["admin"] },
  { label: "360° View", path: "/360-view", icon: <Assessment />, roles: ["admin", "mentor", "faculty"] },
  { label: "Attendance", path: "/attendance", icon: <CalendarToday />, roles: ["admin", "mentor"] },
  { label: "Assessments", path: "/assessments", icon: <Assignment />, roles: ["admin"] },
  { label: "Fees", icon: <AttachMoney />, path: "/fees", roles: ["admin"] },
  { label: "Question Bank", path: "/question-bank", icon: <QuestionAnswer />, roles: ["admin"] },
  { label: "Paper Generator", path: "/paper-generator", icon: <Description />, roles: ["admin"] },
  { label: "Class Schedule", path: "/class-schedule", icon: <CalendarToday />, roles: ["admin"] },
  // ═══════════════════════════════════════════════════════════════════════
  // NEW: Curriculum Mapping for Admin
  // ═══════════════════════════════════════════════════════════════════════
  { label: "Curriculum", path: "/admin/curriculum", icon: <School />, roles: ["admin"] },
  { label: "Analytics", path: "/analytics", icon: <Assessment />, roles: ["admin", "mentor"] },
  { label: "Journey", path: "/journey", icon: <TrendingUp />, roles: ["admin", "mentor", "faculty"] },
  { label: "Settings", path: "/settings", icon: <Settings />, roles: ["admin"] },

  // ── HOD — DEPARTMENT-ONLY ────────────────────────────────────────
  { label: "HOD Dashboard", path: "/hod", icon: <Dashboard />, roles: ["hod"] },
  { label: "My Students", path: "/students", icon: <People />, roles: ["hod"] },
  { label: "360° View", path: "/360-view", icon: <Assessment />, roles: ["hod"] },
  { label: "Attendance", path: "/attendance", icon: <CalendarToday />, roles: ["hod"] },
  { label: "Assessments", path: "/assessments", icon: <Assignment />, roles: ["hod"] },
  { label: "Question Bank", path: "/question-bank", icon: <QuestionAnswer />, roles: ["hod"] },
  { label: "Paper Generator", path: "/paper-generator", icon: <Description />, roles: ["hod"] },
  { label: "Class Schedule", path: "/class-schedule", icon: <CalendarToday />, roles: ["hod"] },
  // ═══════════════════════════════════════════════════════════════════════
  // NEW: Curriculum Mapping for HOD
  // ═══════════════════════════════════════════════════════════════════════
  { label: "Curriculum", path: "/admin/curriculum", icon: <School />, roles: ["hod"] },
  { label: "Department Analytics", path: "/analytics", icon: <BarChartIcon />, roles: ["hod"] },
  { label: "Journey", path: "/journey", icon: <TrendingUp />, roles: ["hod"] },

  // ── MENTOR ─────────────────────────────────────────────────────────
  { label: "Dashboard", path: "/", icon: <Dashboard />, roles: ["mentor"] },
  { label: "My Students", path: "/students", icon: <People />, roles: ["mentor"] },
  { label: "360° View", path: "/360-view", icon: <Assessment />, roles: ["mentor"] },
  { label: "Attendance", path: "/attendance", icon: <CalendarToday />, roles: ["mentor"] },
  { label: "Analytics", path: "/analytics", icon: <Assessment />, roles: ["mentor"] },
  { label: "Journey", path: "/journey", icon: <TrendingUp />, roles: ["mentor"] },

  // ── FACULTY ────────────────────────────────────────────────────────
  { label: "Faculty Dashboard", path: "/faculty", icon: <Dashboard />, roles: ["faculty"] },
  { label: "My Schedule", path: "/faculty/schedule", icon: <CalendarToday />, roles: ["faculty"] },
  { label: "My Attendance", path: "/faculty/attendance", icon: <CalendarToday />, roles: ["faculty"] },
  { label: "Mark Attendance", path: "/faculty/mark-attendance", icon: <CheckCircle />, roles: ["faculty"] },
  // ═══════════════════════════════════════════════════════════════════════
  // NEW: My Curriculum for Faculty
  // ═══════════════════════════════════════════════════════════════════════
  { label: "My Curriculum", path: "/faculty/curriculum", icon: <School />, roles: ["faculty"] },
  { label: "Topics", path: "/faculty/topics", icon: <School />, roles: ["faculty"] },
  { label: "Papers", path: "/faculty/papers", icon: <Description />, roles: ["faculty"] },
  { label: "Question Bank", path: "/faculty/question-bank", icon: <QuestionAnswer />, roles: ["faculty"] },
  { label: "Paper Generator", path: "/faculty/paper-generator", icon: <Description />, roles: ["faculty"] },
  // ═══════════════════════════════════════════════════════════════════════
  // NEW: AI Question Generator
  // ═══════════════════════════════════════════════════════════════════════
  { label: "AI Question Generator", path: "/faculty/ai-questions", icon: <AutoFixHigh />, roles: ["faculty"] },
  { label: "Student Analysis", path: "/faculty/student-analysis", icon: <Assessment />, roles: ["faculty"] },
  { label: "Reschedule", path: "/faculty/reschedule", icon: <CalendarToday />, roles: ["faculty"] },
  { label: "Upload Material", path: "/faculty/upload-material", icon: <UploadFile />, roles: ["faculty"] },
  { label: "Announcements", path: "/faculty/announcements", icon: <Assignment />, roles: ["faculty"] },
  { label: "Assignments", path: "/faculty/assignments", icon: <Assignment />, roles: ["faculty"] },
  { label: "Calendar", path: "/faculty/calendar", icon: <CalendarToday />, roles: ["faculty"] },
];

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { resolvedMode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Filter nav items by user role
  const filteredNav = navItems.filter(item =>
    item.roles.includes(user?.role || "")
  );

  // Group nav items by category for better visual separation
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin": return "Super Admin";
      case "admin": return "Principal";
      case "hod": return "HOD";
      case "mentor": return "Mentor";
      case "faculty": return "Faculty";
      default: return role;
    }
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <Toolbar sx={{ px: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <School sx={{ color: "primary.main", fontSize: 32 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          Vriddhi
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: "divider" }} />

      {/* User Info */}
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar src={user?.avatar || undefined} sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Box sx={{ overflow: "hidden" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "capitalize" }}>
            {getRoleLabel(user?.role || "")}
            {user?.department && ` · ${user.department}`}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: "divider" }} />

      {/* Navigation */}
      <List sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": { bgcolor: "primary.dark" },
                    "& .MuiListItemIcon-root": { color: "white" },
                  },
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? "white" : "text.secondary" }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "white" : "inherit",
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Theme Toggle + Logout */}
      <Box sx={{ p: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={toggleMode}
            sx={{
              borderRadius: 2,
              mx: 1,
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
              {resolvedMode === "dark" ? <LightMode /> : <DarkMode />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontSize: 14 }}>
                  {resolvedMode === "dark" ? "Light Mode" : "Dark Mode"}
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              mx: 1,
              color: "error.main",
              "&:hover": { bgcolor: "error.light", opacity: 0.1 },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontSize: 14 }}>
                  Logout
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Mobile AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          display: { md: "none" },
          bgcolor: "background.paper",
          color: "text.primary",
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flex: 1 }}>
            Vriddhi
          </Typography>
          <Tooltip title={resolvedMode === "dark" ? "Switch to light" : "Switch to dark"}>
            <IconButton onClick={toggleMode} color="inherit">
              {resolvedMode === "dark" ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, bgcolor: "background.paper" },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, borderRight: "none" },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
          pt: { xs: 8, md: 0 },
          bgcolor: "background.default",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
