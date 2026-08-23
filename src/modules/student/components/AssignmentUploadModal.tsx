// src/modules/student/components/AssignmentUploadModal.tsx
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, File, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import type { Assignment } from '../types/student';
import {
  submitAssignmentWithFiles,
  validateFile,
  formatFileSize,
  isImageFile,
} from '../services/assignmentService';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';

interface AssignmentUploadModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignmentId: string) => void;
}

export default function AssignmentUploadModal({ assignment, isOpen, onClose, onSubmit }: AssignmentUploadModalProps) {
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);
  const studentId = profile?.id || user?.uid || '';

  const [files, setFiles] = useState<File[]>([]);
  const [comment, setComment] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    '.pdf', '.doc', '.docx', '.txt',
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.zip', '.ppt', '.pptx', '.xls', '.xlsx',
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (newFiles: File[]) => {
    setError(null);
    const validFiles: File[] = [];

    for (const file of newFiles) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        setError(validation.error || 'Invalid file');
      }
    }

    setFiles(prev => [...prev, ...validFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }
    if (!studentId) {
      setError('Your profile is still loading. Please try again in a moment.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await submitAssignmentWithFiles(assignment.id, studentId, files, comment, {
        onProgress: setUploadProgress,
      });

      setSuccess(true);
      setTimeout(() => {
        onSubmit(assignment.id);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setComment('');
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-700/30 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-white">Submit Assignment</h3>
              <p className="text-sm text-slate-400">{assignment.title}</p>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">Assignment Submitted!</h4>
                <p className="text-slate-400">Your submission has been received successfully.</p>
              </motion.div>
            ) : (
              <>
                {/* Assignment Info */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-teal-400" />
                    <span className="text-sm text-slate-300">{assignment.subject}</span>
                  </div>
                  <p className="text-xs text-slate-400">{assignment.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="text-amber-400">Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN')} {assignment.dueTime}</span>
                    <span className="text-slate-500">{assignment.maxMarks} marks</span>
                  </div>
                </div>

                {/* File Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-teal-500 bg-teal-500/5'
                      : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                    accept={allowedTypes.join(',')}
                  />
                  <Upload size={32} className="mx-auto mb-3 text-slate-500" />
                  <p className="text-sm text-slate-300 font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supported: {allowedTypes.join(', ')} &bull; Max 50MB per file &bull; Max 10 files
                  </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"
                      >
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          {isImageFile(file.name) ? <ImageIcon size={16} className="text-purple-400" /> : <File size={16} className="text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Comment */}
                <div className="mt-4">
                  <label className="text-sm text-slate-300 font-medium mb-2 block">Comment (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add any notes for your instructor..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 resize-none"
                    rows={3}
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                  >
                    <AlertTriangle size={16} className="text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}

                {/* Progress */}
                {uploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">Uploading...</span>
                      <span className="text-teal-400">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="p-5 border-t border-slate-700/30 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => { reset(); onClose(); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || files.length === 0}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Submit Assignment
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}