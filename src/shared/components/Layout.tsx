import React, { useState, useEffect } from "react";
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
  CheckCircle,
} from "@mui/icons-material";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/Firebase/config';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/superadmin", icon: <Dashboard />, roles: ["superadmin"] },
  { label: "Colleges", path: "/superadmin/colleges", icon: <Business />, roles: ["superadmin"] },
  { label: "Universities", path: "/superadmin/universities", icon: <AccountBalance />, roles: ["superadmin"] },
  { label: "Create College", path: "/superadmin/colleges/new", icon: <PersonAdd />, roles: ["superadmin"] },
  { label: "Admins", path: "/superadmin/admins", icon: <SupervisedUserCircle />, roles: ["superadmin"] },
  { label: "Create Admin", path: "/superadmin/admins/new", icon: <AdminPanelSettings />, roles: ["superadmin"] },
  { label: "Curriculum", path: "/superadmin/curriculum", icon: <School />, roles: ["superadmin"] },
  { label: "Manage Students", path: "/superadmin/students", icon: <ManageAccounts />, roles: ["superadmin"] },
  { label: "Import Users", path: "/superadmin/students/import", icon: <UploadFile />, roles: ["superadmin"] },
  { label: "Comparison", path: "/superadmin/comparison", icon: <BarChartIcon />, roles: ["superadmin"] },
  { label: "Billing", path: "/superadmin/billing", icon: <CreditCardIcon />, roles: ["superadmin"] },
  { label: "Health", path: "/superadmin/health", icon: <MonitorHeartIcon />, roles: ["superadmin"] },
  { label: "Import Faculty", path: "/superadmin/faculty/import", icon: <School />, roles: ["superadmin"] },
  { label: "Manage Faculty", path: "/superadmin/faculty", icon: <People />, roles: ["superadmin"] },

  // ─── ADMIN / HOD / PRINCIPAL (legacy shared) ───
  { label: "Dashboard", path: "/admin", icon: <Dashboard />, roles: ["admin", "principal"] },
  { label: "Students", path: "/admin/students", icon: <People />, roles: ["admin", "principal"] },
  { label: "360° View", path: "/admin/view360", icon: <Assessment />, roles: ["admin", "principal"] },
  { label: "Attendance", path: "/admin/attendance", icon: <CalendarToday />, roles: ["admin", "principal"] },
  { label: "Assessments", path: "/admin/assessments", icon: <Assignment />, roles: ["admin", "principal"] },
  { label: "Fees", icon: <AttachMoney />, path: "/admin/fee-management", roles: ["admin", "principal"] },
  { label: "Question Bank", path: "/admin/question-bank", icon: <QuestionAnswer />, roles: ["admin", "principal"] },
  { label: "Paper Generator", path: "/admin/paper-generator", icon: <Description />, roles: ["admin", "principal"] },
  { label: "Class Schedule", path: "/admin/class-schedule", icon: <CalendarToday />, roles: ["admin", "principal"] },
  { label: "Curriculum", path: "/admin/curriculum", icon: <School />, roles: ["admin", "principal"] },
  { label: "Analytics", path: "/admin/analytics", icon: <Assessment />, roles: ["admin", "principal"] },
  { label: "Journey", path: "/admin/journey", icon: <TrendingUp />, roles: ["admin", "principal"] },
  { label: "Settings", path: "/admin/settings", icon: <Settings />, roles: ["admin", "principal"] },

  { label: "HOD Dashboard", path: "/admin/hod-dashboard", icon: <Dashboard />, roles: ["hod", "principal"] },
  { label: "My Students", path: "/admin/students", icon: <People />, roles: ["hod", "principal"] },
  { label: "360° View", path: "/admin/view360", icon: <Assessment />, roles: ["hod", "principal"] },
  { label: "Attendance", path: "/admin/attendance", icon: <CalendarToday />, roles: ["hod", "principal"] },
  { label: "Assessments", path: "/admin/assessments", icon: <Assignment />, roles: ["hod", "principal"] },
  { label: "Question Bank", path: "/admin/question-bank", icon: <QuestionAnswer />, roles: ["hod", "principal"] },
  { label: "Paper Generator", path: "/admin/paper-generator", icon: <Description />, roles: ["hod", "principal"] },
  { label: "Class Schedule", path: "/admin/class-schedule", icon: <CalendarToday />, roles: ["hod", "principal"] },
  { label: "Curriculum", path: "/admin/curriculum", icon: <School />, roles: ["hod", "principal"] },
  { label: "Department Analytics", path: "/admin/analytics", icon: <BarChartIcon />, roles: ["hod", "principal"] },
  { label: "Journey", path: "/admin/journey", icon: <TrendingUp />, roles: ["hod", "principal"] },

  { label: "Dashboard", path: "/", icon: <Dashboard />, roles: ["mentor"] },
  { label: "My Students", path: "/students", icon: <People />, roles: ["mentor"] },
  { label: "360° View", path: "/360-view", icon: <Assessment />, roles: ["mentor"] },
  { label: "Attendance", path: "/attendance", icon: <CalendarToday />, roles: ["mentor"] },
  { label: "Analytics", path: "/analytics", icon: <Assessment />, roles: ["mentor"] },
  { label: "Journey", path: "/journey", icon: <TrendingUp />, roles: ["mentor"] },

  { label: "Faculty Dashboard", path: "/faculty", icon: <Dashboard />, roles: ["faculty"] },
  { label: "My Attendance", path: "/faculty/attendance", icon: <CalendarToday />, roles: ["faculty"] },
  { label: "Mark Attendance", path: "/faculty/attendance-marking", icon: <CheckCircle />, roles: ["faculty"] },
  { label: "My Curriculum", path: "/faculty/curriculum", icon: <School />, roles: ["faculty"] },
  { label: "Topics", path: "/faculty/topics", icon: <School />, roles: ["faculty"] },
  { label: "Papers", path: "/faculty/papers", icon: <Description />, roles: ["faculty"] },
  { label: "Question Bank", path: "/faculty/question-bank", icon: <QuestionAnswer />, roles: ["faculty"] },
  { label: "Paper Generator", path: "/faculty/paper-generator", icon: <Description />, roles: ["faculty"] },
  { label: "Student Analysis", path: "/faculty/student-analysis", icon: <Assessment />, roles: ["faculty"] },
  { label: "Reschedule", path: "/faculty/reschedule", icon: <CalendarToday />, roles: ["faculty"] },
  { label: "Upload Material", path: "/faculty/upload-material", icon: <UploadFile />, roles: ["faculty"] },
  { label: "Announcements", path: "/faculty/announcements", icon: <Assignment />, roles: ["faculty"] },
  { label: "Assignments", path: "/faculty/assignments", icon: <Assignment />, roles: ["faculty"] },
  { label: "Calendar", path: "/faculty/calendar", icon: <CalendarToday />, roles: ["faculty"] },
];

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { resolvedMode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collegeName, setCollegeName] = useState<string>('');

  useEffect(() => {
    console.log('[Layout] Route changed:', location.pathname);
    console.log('[Layout DEBUG] user.role:', user?.role, '| pathname:', location.pathname);
  }, [location.pathname, user?.role]);

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
    await logout();
    navigate("/");
  };

  const effectiveRole = user?.role;

  // Deduplicate: same path may appear under multiple role blocks
  const filteredNav = React.useMemo(() => {
    const seen = new Set<string>();
    return navItems
      .filter(item => item.roles.includes(effectiveRole || ""))
      .filter(item => {
        if (seen.has(item.path)) return false;
        seen.add(item.path);
        return true;
      });
  }, [effectiveRole]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin": return "Super Admin";
      case "admin": return "Admin";
      case "principal": return "Principal";
      case "hod": return "HOD";
      case "mentor": return "Mentor";
      case "faculty": return "Faculty";
      default: return role;
    }
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <School sx={{ color: "primary.main", fontSize: 32 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          Vriddhi
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: "divider" }} />

      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar src={user?.avatar || undefined} sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Box sx={{ overflow: "hidden", flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "capitalize", display: "block" }}>
            {getRoleLabel(effectiveRole || "")}
            {user?.department && ` · ${user.department}`}
          </Typography>
          {collegeName && (
            <Typography variant="caption" sx={{ color: "primary.main", display: "block", mt: 0.5, fontWeight: 500 }}>
              {collegeName}
            </Typography>
          )}
        </Box>
      </Box>
      <Divider sx={{ borderColor: "divider" }} />

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
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          display: { md: "none" },
          bgcolor: "background.paper",
          color: "text.primary",
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Vriddhi
            </Typography>
            {collegeName && (
              <Typography variant="caption" sx={{ color: "primary.main", display: "block" }}>
                {collegeName}
              </Typography>
            )}
          </Box>
          <Tooltip title={resolvedMode === "dark" ? "Switch to light" : "Switch to dark"}>
            <IconButton onClick={toggleMode} color="inherit">
              {resolvedMode === "dark" ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
          pt: { xs: 8, md: 0 },
          bgcolor: "background.default",
          overflow: "auto",
        }}
      >
        {children || <Outlet />}
      </Box>
    </Box>
  );
};

export default Layout;