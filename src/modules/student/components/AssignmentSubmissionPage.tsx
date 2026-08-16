import React, { useState, useEffect } from 'react';
import { FileText, Upload, X, Send, Clock, CheckCircle, BookOpen } from 'lucide-react';
import type { Assignment, AssignmentSubmission } from '../types/student';
import { getStudentAssignments, getAssignmentSubmission, submitAssignment } from '../services/studentService';
import { StatusBadge } from './shared/StatusBadge';
import { PageHeader } from './shared/PageHeader';

export const AssignmentSubmissionPage: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const assignmentsData = await getStudentAssignments(studentId);
      setAssignments(assignmentsData);

      // Load submissions for each assignment
      const submissionsMap: Record<string, AssignmentSubmission> = {};
      await Promise.all(
        assignmentsData.map(async (assignment: Assignment) => {
          const submission = await getAssignmentSubmission(assignment.id, studentId);
          if (submission) {
            submissionsMap[assignment.id] = submission;
          }
        })
      );
      setSubmissions(submissionsMap);
      setLoading(false);
    };
    loadData();
  }, [studentId]);

  const filteredAssignments = assignments.filter((a: Assignment) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'submitted') return a.status === 'submitted' || a.status === 'graded';
    if (filter === 'overdue') return a.status === 'overdue';
    return true;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || files.length === 0) return;
    setSubmitting(true);
    try {
      await submitAssignment(selectedAssignment.id, studentId, files, remarks);
      // Refresh submissions
      const submission = await getAssignmentSubmission(selectedAssignment.id, studentId);
      if (submission) {
        setSubmissions(prev => ({ ...prev, [selectedAssignment.id]: submission }));
      }
      setFiles([]);
      setRemarks('');
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'graded': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'late-submitted': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading assignments...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Assignment Submissions" subtitle="View and submit your assignments" />

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {(['all', 'pending', 'submitted', 'overdue'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize font-medium transition-colors ${
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No assignments found.</p>
            </div>
          ) : (
            filteredAssignments.map((assignment: Assignment) => {
              const submission = submissions[assignment.id];
              const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === 'pending';

              return (
                <div
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(assignment)}
                  className={`p-5 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedAssignment?.id === assignment.id ? 'ring-2 ring-blue-500 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-500">{assignment.subject} ({assignment.subjectCode})</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()} {assignment.dueTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{assignment.maxMarks} marks</span>
                    </div>
                  </div>

                  {submission && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">
                          Submitted on {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {submission.marksObtained !== undefined && (
                        <p className="text-sm text-gray-600 mt-1">
                          Marks: {submission.marksObtained} / {assignment.maxMarks}
                        </p>
                      )}
                      {submission.feedback && (
                        <p className="text-sm text-gray-600 mt-1">Feedback: {submission.feedback}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Submission Panel */}
        <div className="bg-white border rounded-xl p-6 sticky top-6">
          {selectedAssignment ? (
            <div>
              <h3 className="font-semibold text-lg mb-2">{selectedAssignment.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{selectedAssignment.description}</p>

              {/* Attachments */}
              {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                  <div className="space-y-2">
                    {selectedAssignment.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-600 hover:underline">{attachment.name}</span>
                        <X className="w-4 h-4 text-gray-400 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload */}
              {selectedAssignment.status === 'pending' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload files</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, images up to 10MB</p>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            onClick={() => setFiles(files.filter((_, i) => i !== index))}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add remarks (optional)"
                    className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={files.length === 0 || submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Assignment
                      </>
                    )}
                  </button>
                </div>
              )}

              {selectedAssignment.status !== 'pending' && (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">This assignment has already been submitted.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select an assignment to view details and submit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};