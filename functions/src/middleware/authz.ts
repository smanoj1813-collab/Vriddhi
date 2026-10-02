import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './authTypes'

export function resolveCollegeId(req: AuthenticatedRequest): string | undefined {
  // A Vriddhi employee works in exactly one college at a time: the active
  // college claim minted by setEmployeeActiveCollege. A requested override is
  // honoured only when it matches that claim, so a stale header cannot widen
  // access to another assigned college without going through the switch.
  if (req.user?.role === 'employee') {
    const fromHeader = (req.headers['x-college-id'] as string) || undefined
    const requested =
      (typeof req.body?.collegeId === 'string' && req.body.collegeId) ||
      (typeof req.query?.collegeId === 'string' && req.query.collegeId) ||
      fromHeader
    if (requested && requested === req.user.collegeId) return requested
    return req.user.collegeId || undefined
  }
  if (req.user?.role === 'superadmin') {
    const fromHeader = (req.headers['x-college-id'] as string) || undefined
    const requested =
      (typeof req.body?.collegeId === 'string' && req.body.collegeId) ||
      (typeof req.query?.collegeId === 'string' && req.query.collegeId) ||
      fromHeader
    return requested || req.user.collegeId || undefined
  }
  return req.user?.collegeId || undefined
}

export function assertCollegeAccess(req: AuthenticatedRequest, collegeId?: string | null): boolean {
  if (req.user?.role === 'superadmin') return true
  // Employees are college-scoped by their active claim; with no claim they
  // hold no college access at all (fail closed).
  if (req.user?.role === 'employee') {
    return Boolean(collegeId) && req.user.collegeId === collegeId
  }
  if (!collegeId || !req.user?.collegeId) return false
  return req.user.collegeId === collegeId
}

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!allowedRoles.includes(req.user.role || '')) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
      return
    }

    next()
  }
}
