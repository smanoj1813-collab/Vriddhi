// src/modules/courses/routes.tsx
//
// Two homes for the same course pages:
//
//   • studentCourseRoutes — children of /student (inside StudentLayout +
//     RoleRoute). Progress is keyed by the signed-in uid.
//   • publicCourseRoutes  — /courses/… outside every guard, for shareable
//     preview links (same pattern as /prep). Progress is device-local.
//
// Pages are lazy so the course bundle (manifest + quizzes, lessons on demand)
// only downloads when a learner opens Courses.

import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import CoursePublicLayout from './CoursePublicLayout'

const CourseCatalogPage = lazy(() => import('./CourseCatalogPage'))
const CourseOverviewPage = lazy(() => import('./CourseOverviewPage'))
const CourseLessonPage = lazy(() => import('./CourseLessonPage'))

export const STUDENT_COURSES_PATH = '/student/courses'
export const PUBLIC_COURSES_PATH = '/courses'

function Fallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-teal-600">
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  )
}

function StudentCatalog() {
  const { user } = useAuth()
  return <CourseCatalogPage basePath={STUDENT_COURSES_PATH} uid={user?.uid} />
}
function StudentOverview() {
  const { user } = useAuth()
  return <CourseOverviewPage basePath={STUDENT_COURSES_PATH} uid={user?.uid} />
}
function StudentLesson() {
  const { user } = useAuth()
  return <CourseLessonPage basePath={STUDENT_COURSES_PATH} uid={user?.uid} />
}

/** Mount under the `/student` layout route's `children`. */
export const studentCourseRoutes: RouteObject[] = [
  { path: 'courses', element: <StudentCatalog /> },
  { path: 'courses/:courseId', element: <StudentOverview /> },
  { path: 'courses/:courseId/learn/:topicId', element: <StudentLesson /> },
]

/** Top-level public routes. */
export const publicCourseRoutes: RouteObject[] = [
  {
    path: PUBLIC_COURSES_PATH,
    element: <CoursePublicLayout />,
    children: [
      { index: true, element: <Suspense fallback={<Fallback />}><CourseCatalogPage basePath={PUBLIC_COURSES_PATH} publicPreview /></Suspense> },
      { path: ':courseId', element: <Suspense fallback={<Fallback />}><CourseOverviewPage basePath={PUBLIC_COURSES_PATH} /></Suspense> },
      { path: ':courseId/learn/:topicId', element: <Suspense fallback={<Fallback />}><CourseLessonPage basePath={PUBLIC_COURSES_PATH} /></Suspense> },
    ],
  },
]
