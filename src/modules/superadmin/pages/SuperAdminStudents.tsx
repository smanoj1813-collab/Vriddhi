import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents, useColleges, useUpdateStudent } from '../hooks/useSuperAdmin';
import { useNotification } from '../../../shared/providers/NotificationProvider';
import { Users, Search, Filter, ArrowLeft, Edit3, Eye, GraduationCap, Building2 } from "lucide-react";
import type { Student, College } from '../types/superAdmin';

const SuperAdminStudents: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [showEditModal, setShowEditModal] = useState(false);

  const { data, isLoading } = useStudents({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
  });
  const { data: collegesData } = useColleges({ status: "active" });
  const updateStudent = useUpdateStudent();

  const students = data?.items || [];
  const colleges = collegesData?.items || [];

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      regNo: student.regNo,
      batch: student.batch,
      division: student.division,
      mentor: student.mentor,
      department: student.department || "",
      status: student.status,
      phone: student.phone,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    try {
      await updateStudent.mutateAsync({
        studentId: selectedStudent.id,
        updates: {
          name: editForm.name,
          email: editForm.email,
          regNo: editForm.regNo,
          batch: editForm.batch,
          division: editForm.division,
          mentor: editForm.mentor,
          department: editForm.department || undefined,
          status: editForm.status,
          phone: editForm.phone,
        },
      });
      showSuccess("Student updated successfully");
      setShowEditModal(false);
      setSelectedStudent(null);
    } catch {
      showError("Failed to update student");
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
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <GraduationCap className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Management</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Manage all students across colleges</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{students.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{students.filter((s: Student) => s.status === "active").length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{students.filter((s: Student) => s.status === "inactive").length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Colleges</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{colleges.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="input-field pl-10 pr-8 appearance-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="table-header">Name</th>
              <th className="table-header">Reg No</th>
              <th className="table-header">Email</th>
              <th className="table-header">College</th>
              <th className="table-header text-center">Batch</th>
              <th className="table-header text-center">Division</th>
              <th className="table-header text-center">Department</th>
              <th className="table-header text-center">Status</th>
              <th className="table-header text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student: Student) => (
              <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{student.name[0]}</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-medium">{student.name}</span>
                  </div>
                </td>
                <td className="table-cell font-mono text-xs">{student.regNo}</td>
                <td className="table-cell">{student.email}</td>
                <td className="table-cell">{student.collegeName || "—"}</td>
                <td className="table-cell text-center">{student.batch}</td>
                <td className="table-cell text-center">{student.division}</td>
                <td className="table-cell text-center">
                  <span className="text-slate-600 dark:text-slate-400">{student.department || "-"}</span>
                </td>
                <td className="table-cell text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    student.status === "active" 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" 
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  }`}>
                    {student.status}
                  </span>
                </td>
                <td className="table-cell text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(student)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button onClick={() => setSelectedStudent(student)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No students found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Edit Student</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input type="text" value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" value={editForm.email || ""} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Reg No</label>
                <input type="text" value={editForm.regNo || ""} onChange={e => setEditForm({ ...editForm, regNo: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Batch</label>
                  <input type="text" value={editForm.batch || ""} onChange={e => setEditForm({ ...editForm, batch: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Division</label>
                  <input type="text" value={editForm.division || ""} onChange={e => setEditForm({ ...editForm, division: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Mentor</label>
                <input type="text" value={editForm.mentor || ""} onChange={e => setEditForm({ ...editForm, mentor: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input type="text" value={editForm.department || ""} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as Student["status"] })} className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={updateStudent.isPending} className="btn-primary flex-1">
                  {updateStudent.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedStudent && !showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Student Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Name</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedStudent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Email</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedStudent.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Reg No</span>
                <span className="text-slate-900 dark:text-white font-mono">{selectedStudent.regNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Batch</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedStudent.batch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Division</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedStudent.division}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Department</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedStudent.department || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Mentor</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedStudent.mentor || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Status</span>
                <span className={`${selectedStudent.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"} font-medium`}>{selectedStudent.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Phone</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedStudent.phone || "—"}</span>
              </div>
              {selectedStudent.uid && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">UID</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{selectedStudent.uid}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Created</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(selectedStudent.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
              {selectedStudent.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Updated</span>
                  <span className="text-slate-700 dark:text-slate-300">{new Date(selectedStudent.updatedAt).toLocaleDateString("en-IN")}</span>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedStudent(null)} className="btn-secondary w-full mt-6">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminStudents;
