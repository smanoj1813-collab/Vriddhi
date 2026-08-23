import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './authTypes'

export function resolveCollegeId(req: AuthenticatedRequest): string | undefined {
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
