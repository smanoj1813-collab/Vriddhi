import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColleges, useCreateAdmin } from '../hooks/useSuperAdmin';
import { useNotification } from '../../../shared/providers/NotificationProvider';
import {
  UserPlus, Mail, Phone, Shield, ArrowLeft, Save,
  ChevronDown, Loader2, Eye, EyeOff
} from 'lucide-react';
import type { College } from '../api/superAdminApi';

interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  collegeId: string;
  role: string;
  password: string;
  confirmPassword: string;
  isActive: boolean;
}

const initialFormData: AdminFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  collegeId: '',
  role: 'admin',
  password: '',
  confirmPassword: '',
  isActive: true,
};

const CreateCollegeAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { data: collegesData, isLoading: collegesLoading } = useColleges();
  const createAdmin = useCreateAdmin();

  const [formData, setFormData] = useState<AdminFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof AdminFormData, string>>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const colleges = collegesData?.items || [];

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AdminFormData, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter valid email address';
    }

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Enter valid 10-digit phone number';
    }

    if (!formData.collegeId) newErrors.collegeId = 'Please select a college';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name as keyof AdminFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await createAdmin.mutateAsync({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role as string as any,
        collegeId: formData.collegeId,
        password: formData.password,
      });

      showSuccess(`Admin "${formData.firstName} ${formData.lastName}" created successfully!`);
      setSubmitSuccess(true);

      setTimeout(() => {
        navigate('/superadmin/admins');
      }, 1500);
    } catch (error: any) {
      const msg = error?.message || 'Failed to create admin. Email might already exist.';
      showError(msg);
      setErrors(prev => ({ ...prev, email: msg }));
    }
  };

  const inputClasses = (fieldName: keyof AdminFormData) =>
    `w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-sm text-white transition-colors
     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
     placeholder-slate-500
     ${errors[fieldName] ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-slate-600'}`;

  const labelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const requiredMark = <span className="text-red-400">*</span>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create College Admin</h1>
          <p className="text-sm text-slate-400 mt-1">Assign an administrator to manage a college</p>
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-green-400">Admin created successfully!</p>
            <p className="text-sm text-green-400/70">Redirecting to admins list...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>
                First Name {requiredMark}
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={inputClasses('firstName')}
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="mt-1.5 text-xs text-red-400">{errors.firstName}</p>}
            </div>

            <div>
              <label className={labelClasses}>
                Last Name {requiredMark}
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={inputClasses('lastName')}
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="mt-1.5 text-xs text-red-400">{errors.lastName}</p>}
            </div>

            <div>
              <label className={labelClasses}>
                <Mail className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Email {requiredMark}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClasses('email')}
                placeholder="admin@college.edu"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className={labelClasses}>
                <Phone className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Phone {requiredMark}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClasses('phone')}
                placeholder="10-digit phone number"
              />
              {errors.phone && <p className="mt-1.5 text-xs text-red-400">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* College Assignment */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">College Assignment</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>
                Select College {requiredMark}
              </label>
              <div className="relative">
                <select
                  name="collegeId"
                  value={formData.collegeId}
                  onChange={handleChange}
                  disabled={collegesLoading}
                  className={`${inputClasses('collegeId')} appearance-none pr-10 disabled:opacity-50`}
                >
                  <option value="" className="bg-slate-800 text-slate-400">
                    {collegesLoading ? 'Loading colleges...' : 'Select a college'}
                  </option>
                  {colleges.map((college: College) => (
                    <option key={college.id} value={college.id} className="bg-slate-800">
                      {college.name} ({college.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.collegeId && <p className="mt-1.5 text-xs text-red-400">{errors.collegeId}</p>}
              {colleges.length === 0 && !collegesLoading && (
                <p className="mt-1.5 text-xs text-yellow-400">No colleges found. Create a college first.</p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Admin Role</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`${inputClasses('role')} appearance-none pr-10`}
                >
                  <option value="admin" className="bg-slate-800">College Admin</option>
                  <option value="principal" className="bg-slate-800">Principal</option>
                  <option value="hod" className="bg-slate-800">Head of Department</option>
                  <option value="mentor" className="bg-slate-800">Mentor</option>
                  <option value="coordinator" className="bg-slate-800">Coordinator</option>
                  <option value="department_head" className="bg-slate-800">Department Head</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-semibold text-white">Set Password</h2>
            </div>
            <button
              type="button"
              onClick={generatePassword}
              className="text-sm text-teal-400 hover:text-teal-300 font-medium"
            >
              Generate Random Password
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>
                Password {requiredMark}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClasses('password')}
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label className={labelClasses}>
                Confirm Password {requiredMark}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClasses('confirmPassword')}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>
          </div>

          {formData.password && (
            <div className="mt-3 p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
              <p className="text-sm text-teal-400 font-medium">Generated Password:</p>
              <p className="text-sm text-teal-300 font-mono mt-1">{formData.password}</p>
              <p className="text-xs text-teal-400/70 mt-1">This password will be stored securely.</p>
            </div>
          )}
        </div>

        {/* Account Status */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Account Status</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-teal-600 bg-slate-800 border-slate-600 rounded focus:ring-teal-500"
            />
            <span className="text-sm text-slate-300">Activate account immediately</span>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => {
              setFormData(initialFormData);
              setErrors({});
            }}
            className="px-6 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={createAdmin.isPending || submitSuccess}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createAdmin.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : submitSuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Created!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Admin
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCollegeAdmin;