import { createContext, useContext } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useCourseAssignments } from '@/shared/courses/useCourseAssignments'
import type { CourseAssignment } from '@/shared/courses/courseCloud'
import { EmptyState } from './courseUi'

interface StudentCourseAccessValue {
  uid?: string
  collegeId?: string
  learnerName?: string | null
  loading: boolean
  error: string | null
  assignedCourseIds: string[]
  assignments: Record<string, CourseAssignment>
}

const StudentCourseAccessContext = createContext<StudentCourseAccessValue | null>(null)

export function StudentCourseAccessProvider({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth()
  const access = useCourseAssignments(user?.uid, user?.collegeId, user?.email)
  return (
    <StudentCourseAccessContext.Provider value={{
      uid: user?.uid,
      collegeId: user?.collegeId,
      learnerName: user?.name || user?.displayName,
      ...access,
    }}>
      {children ?? <Outlet />}
    </StudentCourseAccessContext.Provider>
  )
}

export function useStudentCourseAccess(): StudentCourseAccessValue {
  const value = useContext(StudentCourseAccessContext)
  if (!value) throw new Error('useStudentCourseAccess must be used inside StudentCourseAccessProvider')
  return value
}

export function CourseAccessStatus({ children }: { children?: React.ReactNode }) {
  const access = useStudentCourseAccess()
  if (access.loading) {
    return <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-teal-600" /> Loading your college’s course assignments…</div>
  }
  if (access.error) {
    return <div className="mx-auto max-w-3xl"><EmptyState title="Could not verify course access" body={access.error} action={<Link to="/student/courses" className="text-sm font-semibold text-teal-700 underline">Try again</Link>} /></div>
  }
  return <>{children}</>
}

function localDateKey() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

export function StudentCourseUnavailable({ children }: { children: React.ReactNode }) {
  const { courseId = '' } = useParams()
  const access = useStudentCourseAccess()
  const assigned = access.assignedCourseIds.includes(courseId)
  const assignment = access.assignments[courseId]
  const today = localDateKey()
  const startsInFuture = assigned && !!assignment?.startsOn && assignment.startsOn > today

  if (!assigned) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Course not available for your college"
          body="This course has not been assigned to your college or your programme. Contact your college administrator if you think this is a mistake."
          action={<Link to="/student/courses" className="text-sm font-semibold text-teal-700 underline">Back to your courses</Link>}
        />
      </div>
    )
  }
  if (startsInFuture) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="This course has not started yet"
          body={`Your college assignment opens on ${assignment.startsOn}.`}
          action={<Link to="/student/courses" className="text-sm font-semibold text-teal-700 underline">Back to your courses</Link>}
        />
      </div>
    )
  }
  const hasDetails = !!(assignment?.startsOn || assignment?.dueOn || assignment?.notes)
  return (
    <>
      {hasDetails ? (
        <div className="mx-auto mb-4 max-w-5xl rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-xs text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/20 dark:text-teal-100">
          <p className="font-bold">College course assignment</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold">
            {assignment?.startsOn ? <span>Starts {assignment.startsOn}</span> : null}
            {assignment?.dueOn ? <span>Due {assignment.dueOn}</span> : null}
          </div>
          {assignment?.notes ? <p className="mt-1 whitespace-pre-wrap leading-relaxed">{assignment.notes}</p> : null}
        </div>
      ) : null}
      {children}
    </>
  )
}

export function CourseAccessError() {
  return <div className="mx-auto max-w-3xl"><EmptyState title="Course access required" body="Sign in with your college account to access assigned courses." action={<Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 underline"><ShieldAlert className="h-4 w-4" /> Sign in</Link>} /></div>
}
