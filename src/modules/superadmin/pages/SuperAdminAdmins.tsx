import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdminStatus,
  useColleges,
  useFacultyList,
  usePromoteToAdmin,
} from "../hooks/useSuperAdmin";
import { useNotification } from "../../../shared/providers/NotificationProvider";
import {
  Shield,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Power,
  PowerOff,
  UserPlus,
  X,
  Check,
  Loader2,
  GraduationCap,
} from "lucide-react";
import type { Admin, CreateAdminInput, AdminRole, Faculty } from "../types/superAdmin";

const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Super Admin",
  admin: "Principal",
  hod: "HOD",
  mentor: "Mentor",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  superadmin: "bg-red-500/10 text-red-600 dark:text-red-400",
  admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  hod: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  mentor: "bg-green-500/10 text-emerald-600 dark:text-emerald-400",
};

const SuperAdminAdmins: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const [createForm, setCreateForm] = useState<CreateAdminInput>({
    name: "",
    email: "",
    role: "admin",
    collegeId: "",
    phone: "",
    department: "",
  });

  const [promoteForm, setPromoteForm] = useState<{
    facultyId: string;
    role: AdminRole;
    collegeId: string;
  }>({
    facultyId: "",
    role: "admin",
    collegeId: "",
  });

  const { data: adminsData, isLoading } = useAdmins({
    role: roleFilter === "all" ? undefined : (roleFilter as AdminRole),
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  const { data: collegesData } = useColleges({ status: "active" });
  const { data: facultyData } = useFacultyList(
    { status: "active" },
    { enabled: showPromoteModal }
  );
  const createAdmin = useCreateAdmin();
  const updateAdminStatus = useUpdateAdminStatus();
  const promoteToAdmin = usePromoteToAdmin();

  const admins = adminsData?.items || [];
  const colleges = collegesData?.items || [];
  const facultyList = facultyData?.items || [];

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.collegeId) {
      showError("Name, email, and college are required");
      return;
    }
    try {
      await createAdmin.mutateAsync(createForm);
      showSuccess(`Admin "${createForm.name}" created successfully`);
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        role: "admin",
        collegeId: "",
        phone: "",
        department: "",
      });
    } catch (err: any) {
      showError(err?.message || "Failed to create admin");
    }
  };

  const handlePromote = async () => {
    if (!promoteForm.facultyId || !promoteForm.collegeId) {
      showError("Please select a faculty member and college");
      return;
    }
    const faculty = facultyList.find((f: Faculty) => f.id === promoteForm.facultyId);
    if (!faculty) {
      showError("Faculty not found");
      return;
    }
    try {
      await promoteToAdmin.mutateAsync({
        uid: faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: promoteForm.role,
        collegeId: promoteForm.collegeId,
        phone: faculty.phone,
        department: faculty.department,
      });
      showSuccess(`${faculty.name} promoted to ${ROLE_LABELS[promoteForm.role]}`);
      setShowPromoteModal(false);
      setPromoteForm({ facultyId: "", role: "admin", collegeId: "" });
    } catch (err: any) {
      showError(err?.message || "Failed to promote faculty");
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    const newStatus = admin.status === "active" ? "inactive" : "active";
    try {
      await updateAdminStatus.mutateAsync({
        adminId: admin.id,
        status: newStatus,
      });
      showSuccess(`Admin ${admin.name} is now ${newStatus}`);
    } catch {
      showError("Failed to update admin status");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Management</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Manage all college administrators
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPromoteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            Promote Faculty
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Admins</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{admins.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {admins.filter((a: Admin) => a.status === "active").length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {admins.filter((a: Admin) => a.status === "inactive").length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Principals</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {admins.filter((a: Admin) => a.role === "admin").length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">HODs</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {admins.filter((a: Admin) => a.role === "hod").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search admins..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none"
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Principal</option>
            <option value="hod">HOD</option>
            <option value="mentor">Mentor</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-600 dark:border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-center px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">College</th>
              <th className="text-center px-4 py-3 font-medium">Department</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin: Admin) => (
              <tr
                key={admin.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {admin.name[0]}
                      </span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-medium">{admin.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{admin.email}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[admin.role]}`}
                  >
                    {ROLE_LABELS[admin.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {admin.collegeName || admin.collegeCode || "—"}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                  {admin.department || "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      admin.status === "active"
                        ? "bg-green-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {admin.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(admin)}
                      disabled={updateAdminStatus.isPending}
                      className={`p-1.5 rounded-lg transition-colors ${
                        admin.status === "active"
                          ? "hover:bg-red-500/20 text-red-600 dark:text-red-400"
                          : "hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      }`}
                      title={
                        admin.status === "active" ? "Deactivate" : "Activate"
                      }
                    >
                      {admin.status === "active" ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedAdmin(admin)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No admins found</p>
          </div>
        )}
      </div>

      {/* ─── Create Admin Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Admin</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="input-field"
                  placeholder="admin@college.edu"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Role *
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        role: e.target.value as AdminRole,
                      })
                    }
                    className="input-field"
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Principal</option>
                    <option value="hod">HOD</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    College *
                  </label>
                  <select
                    value={createForm.collegeId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        collegeId: e.target.value,
                      })
                    }
                    className="input-field"
                  >
                    <option value="">Select College</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone || ""}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                    className="input-field"
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={createForm.department || ""}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        department: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="Department"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={createAdmin.isPending}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {createAdmin.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {createAdmin.isPending ? "Creating..." : "Create Admin"}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Promote Faculty Modal ─── */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Promote Faculty to Admin
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Select an existing faculty member and grant admin privileges.
                </p>
              </div>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Faculty Member *
                </label>
                <select
                  value={promoteForm.facultyId}
                  onChange={(e) => {
                    const fid = e.target.value;
                    const fac = facultyList.find(
                      (f: Faculty) => f.id === fid
                    );
                    setPromoteForm({
                      ...promoteForm,
                      facultyId: fid,
                      collegeId: fac?.collegeId || "",
                    });
                  }}
                  className="input-field"
                >
                  <option value="">Select Faculty</option>
                  {facultyList.map((faculty: Faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} — {faculty.email}
                    </option>
                  ))}
                </select>
                {facultyList.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">
                    No active faculty found.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Admin Role *
                  </label>
                  <select
                    value={promoteForm.role}
                    onChange={(e) =>
                      setPromoteForm({
                        ...promoteForm,
                        role: e.target.value as AdminRole,
                      })
                    }
                    className="input-field"
                  >
                    <option value="admin">Principal</option>
                    <option value="hod">HOD</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    College *
                  </label>
                  <select
                    value={promoteForm.collegeId}
                    onChange={(e) =>
                      setPromoteForm({
                        ...promoteForm,
                        collegeId: e.target.value,
                      })
                    }
                    className="input-field"
                  >
                    <option value="">Select College</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePromote}
                  disabled={promoteToAdmin.isPending}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {promoteToAdmin.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {promoteToAdmin.isPending
                    ? "Promoting..."
                    : "Promote to Admin"}
                </button>
                <button
                  onClick={() => setShowPromoteModal(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Admin Modal */}
      {selectedAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Details</h2>
              <button
                onClick={() => setSelectedAdmin(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Name</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {selectedAdmin.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Email</span>
                <span className="text-slate-900 dark:text-white">{selectedAdmin.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Role</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[selectedAdmin.role]}`}
                >
                  {ROLE_LABELS[selectedAdmin.role]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">College</span>
                <span className="text-slate-900 dark:text-white">
                  {selectedAdmin.collegeName ||
                    selectedAdmin.collegeCode ||
                    "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Department</span>
                <span className="text-slate-900 dark:text-white">
                  {selectedAdmin.department || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Status</span>
                <span
                  className={
                    selectedAdmin.status === "active"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {selectedAdmin.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Created</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(selectedAdmin.createdAt).toLocaleDateString(
                    "en-IN"
                  )}
                </span>
              </div>
              {selectedAdmin.lastLogin && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Last Login</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(selectedAdmin.lastLogin).toLocaleDateString(
                      "en-IN"
                    )}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedAdmin(null)}
              className="w-full mt-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAdmins;