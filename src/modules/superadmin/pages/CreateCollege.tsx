import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateCollege } from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import { Building2, ArrowLeft, Save, Loader2, Globe, MapPin, Phone, Mail } from 'lucide-react'
import type { PlanType } from '../types/superAdmin'

interface FormData {
  name: string
  code: string
  shortName: string
  address: string
  city: string
  state: string
  country: string
  location: string
  phone: string
  email: string
  website: string
  plan: PlanType
  currentStudents: number
  currentFaculty: number
  courses: number
}

const initialFormData: FormData = {
  name: '',
  code: '',
  shortName: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  location: '',
  phone: '',
  email: '',
  website: '',
  plan: 'standard',
  currentStudents: 0,
  currentFaculty: 0,
  courses: 0,
}

const CreateCollege: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const createCollege = useCreateCollege()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.name.trim()) newErrors.name = 'College name is required'
    if (!formData.code.trim()) newErrors.code = 'College code is required'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address'
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseInt(value) || 0) : value,
    }))
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      await createCollege.mutateAsync({
        name: formData.name.trim(),
        code: formData.code.trim(),
        shortName: formData.shortName.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        location: formData.location.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website: formData.website.trim(),
        plan: formData.plan,
        currentStudents: formData.currentStudents,
        currentFaculty: formData.currentFaculty,
        courses: formData.courses,
      })
      showSuccess(`College "${formData.name}" created successfully!`)
      navigate('/superadmin/colleges')
    } catch (err: any) {
      showError(err?.message || 'Failed to create college')
    }
  }

  const inputClasses = (fieldName: keyof FormData) =>
    `w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-white transition-colors
     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
     placeholder-slate-500
     ${errors[fieldName] ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-slate-600'}`

  const labelClasses = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'
  const requiredMark = <span className="text-red-600 dark:text-red-400">*</span>

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create College</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Register a new college in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Basic Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelClasses}>College Name {requiredMark}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClasses('name')}
                placeholder="e.g., Vriddhi Academics Demo College"
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className={labelClasses}>College Code {requiredMark}</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={inputClasses('code')}
                placeholder="e.g., VA-001"
              />
              {errors.code && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.code}</p>}
            </div>

            <div>
              <label className={labelClasses}>Short Name</label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                className={inputClasses('shortName')}
                placeholder="e.g., VADC"
              />
            </div>

            <div>
              <label className={labelClasses}>Plan</label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className={`${inputClasses('plan')} appearance-none`}
              >
                <option value="basic" className="bg-slate-800">Basic</option>
                <option value="standard" className="bg-slate-800">Standard</option>
                <option value="premium" className="bg-slate-800">Premium</option>
                <option value="enterprise" className="bg-slate-800">Enterprise</option>
                <option value="pro" className="bg-slate-800">Pro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>
                <Mail className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClasses('email')}
                placeholder="college@example.edu"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className={labelClasses}>
                <Phone className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClasses('phone')}
                placeholder="10-digit phone number"
              />
              {errors.phone && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses}>
                <Globe className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Website
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={inputClasses('website')}
                placeholder="www.example.edu"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelClasses}>
                <MapPin className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`${inputClasses('address')} resize-none h-20`}
                placeholder="Full address"
              />
            </div>

            <div>
              <label className={labelClasses}>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={inputClasses('city')}
                placeholder="e.g., Mysore"
              />
            </div>

            <div>
              <label className={labelClasses}>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={inputClasses('state')}
                placeholder="e.g., Karnataka"
              />
            </div>

            <div>
              <label className={labelClasses}>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={inputClasses('country')}
                placeholder="e.g., India"
              />
            </div>

            <div>
              <label className={labelClasses}>Location (Display)</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={inputClasses('location')}
                placeholder="e.g., Mysore, Karnataka"
              />
            </div>
          </div>
        </div>

        {/* Initial Counts */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Initial Counts (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClasses}>Current Students</label>
              <input
                type="number"
                name="currentStudents"
                value={formData.currentStudents}
                onChange={handleChange}
                className={inputClasses('currentStudents')}
                placeholder="0"
                min={0}
              />
            </div>
            <div>
              <label className={labelClasses}>Current Faculty</label>
              <input
                type="number"
                name="currentFaculty"
                value={formData.currentFaculty}
                onChange={handleChange}
                className={inputClasses('currentFaculty')}
                placeholder="0"
                min={0}
              />
            </div>
            <div>
              <label className={labelClasses}>Courses</label>
              <input
                type="number"
                name="courses"
                value={formData.courses}
                onChange={handleChange}
                className={inputClasses('courses')}
                placeholder="0"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => {
              setFormData(initialFormData)
              setErrors({})
            }}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={createCollege.isPending}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-900 dark:text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createCollege.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create College
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateCollege