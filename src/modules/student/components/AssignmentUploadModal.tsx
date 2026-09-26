// src/modules/student/components/AssignmentUploadModal.tsx
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, File, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle, FileText, Link as LinkIcon } from 'lucide-react';
import type { Assignment } from '../types/student';
import {
  submitAssignmentWithAttachments,
  validateFile,
  formatFileSize,
  getAllowedFileTypes,
  isImageFile,
  type SubmissionDriveLink,
} from '../services/assignmentService';
import { validateDriveLink } from '@/shared/utils/driveLink';
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
  const studentId = profile?.id || '';

  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<SubmissionDriveLink[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [comment, setComment] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = getAllowedFileTypes();

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

  const addDriveLink = () => {
    const check = validateDriveLink(linkInput);
    if (!check.valid || !check.url) {
      setError(check.error || 'Invalid Drive link');
      return;
    }
    const label = linkLabel.trim() || 'Google Drive file';
    setError(null);
    setLinks(prev => [...prev, { name: label.slice(0, 150), url: check.url! }].slice(0, 3));
    setLinkInput('');
    setLinkLabel('');
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0 && links.length === 0) {
      setError('Add at least one file or a Google Drive link');
      return;
    }
    if (!studentId) {
      setError('Your profile is still loading. Please try again in a moment.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await submitAssignmentWithAttachments(assignment.id, studentId, files, links, comment, {
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
    setLinks([]);
    setLinkInput('');
    setLinkLabel('');
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
          className="w-full max-w-2xl bg-white dark:bg-[#131b2e] backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/40 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">Submit Assignment</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{assignment.title}</p>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="p-2.5 -mr-1 shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Close"
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
                <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Assignment Submitted!</h4>
                <p className="text-slate-500 dark:text-slate-400">Your submission has been received successfully.</p>
              </motion.div>
            ) : (
              <>
                {/* Assignment Info */}
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{assignment.subject}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{assignment.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs">
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN')} {assignment.dueTime}</span>
                    <span className="text-slate-500 dark:text-slate-400">{assignment.maxMarks} marks</span>
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
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30'
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
                  <Upload size={32} className="mx-auto mb-3 text-slate-400 dark:text-slate-500" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supported: {allowedTypes.join(', ')} &bull; Max 10MB per file &bull; Max 10 files
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
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30"
                      >
                        <div className="p-2 rounded-lg bg-slate-200/70 dark:bg-slate-700/50 shrink-0">
                          {isImageFile(file.name) ? <ImageIcon size={16} className="text-purple-600 dark:text-purple-400" /> : <File size={16} className="text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-white truncate">{file.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="p-2 shrink-0 rounded hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Google Drive link (optional, for large files like videos) */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">…or attach a Google Drive link</span>
                  </div>
                  {links.length < 3 ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={linkLabel}
                          onChange={(e) => setLinkLabel(e.target.value)}
                          placeholder="Label (e.g. Video solution)"
                          className="w-40 shrink-0 px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                        />
                        <input
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDriveLink(); } }}
                          placeholder="https://drive.google.com/file/d/…/view"
                          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                        />
                        <button
                          onClick={addDriveLink}
                          className="px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 text-xs font-medium hover:bg-teal-100 dark:hover:bg-teal-500/30 transition-colors shrink-0"
                        >
                          Add
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        In Google Drive: share the file as <span className="text-slate-600 dark:text-slate-300 font-medium">Anyone with the link → Viewer</span>, then copy its link.
                        The file stays in your Drive — nothing is uploaded to Vriddhi, so this is ideal for large files like videos.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Maximum 3 Drive links per submission.</p>
                  )}
                  {links.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {links.map((link, index) => (
                        <div
                          key={`${link.url}-${index}`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30"
                        >
                          <div className="p-2 rounded-lg bg-slate-200/70 dark:bg-slate-700/50 shrink-0">
                            <LinkIcon size={16} className="text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 dark:text-white truncate">{link.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Google Drive link — no upload needed</p>
                          </div>
                          <button
                            onClick={() => removeLink(index)}
                            className="p-2 shrink-0 rounded hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            aria-label={`Remove link ${link.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comment */}
                <div className="mt-4">
                  <label className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-2 block">Comment (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add any notes for your instructor..."
                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 resize-none"
                    rows={3}
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-2"
                  >
                    <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}

                {/* Progress */}
                {uploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500 dark:text-slate-400">Uploading...</span>
                      <span className="text-teal-600 dark:text-teal-400 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden">
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
            <div className="p-5 border-t border-slate-200 dark:border-slate-700/40 flex justify-end gap-3 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => { reset(); onClose(); }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || (files.length === 0 && links.length === 0)}
                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 text-white transition-colors flex items-center gap-2"
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
