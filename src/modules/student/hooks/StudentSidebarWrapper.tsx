import { useStudentData } from './../hooks/useStudentData';

// Wrapper that makes StudentSidebar self-contained
// If your StudentSidebar component expects props, replace this with your actual component
// and update it to use useStudentData() internally instead of receiving props.

export default function StudentSidebarWrapper() {
  const studentId = localStorage.getItem('studentToken') || '';
  const { profile, unreadNotifications, loading } = useStudentData(studentId);

  // TODO: Replace this with your actual StudentSidebar component,
  // passing these values as props OR better, update StudentSidebar to use useStudentData directly.
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 h-screen overflow-y-auto hidden md:block">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
            {profile?.name?.charAt(0) || 'S'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.name || 'Student'}</p>
            <p className="text-xs text-slate-400">{profile?.regNo || ''}</p>
          </div>
        </div>
        {unreadNotifications > 0 && (
          <div className="px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400">
            {unreadNotifications} unread notifications
          </div>
        )}
        {/* Add your actual sidebar nav items here */}
      </div>
    </aside>
  );
}