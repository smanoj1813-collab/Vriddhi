export type CurriculumApprovalState = 'pending_principal' | 'approved' | 'returned'
export type ScheduleApprovalState = 'pending_hod' | 'approved' | 'returned'

export function canTransitionCurriculumApproval(from: unknown, to: unknown): boolean {
  const current = String(from || 'pending_principal')
  return current === 'pending_principal' && (to === 'approved' || to === 'returned')
}

export function canTransitionScheduleApproval(from: unknown, to: unknown): boolean {
  const current = String(from || 'pending_hod')
  return current === 'pending_hod' && (to === 'approved' || to === 'returned')
}

export function isCurriculumReadyForMapping(approvalStatus: unknown): boolean {
  // Existing college assignments pre-date the approval workflow; preserve
  // them as approved/live rather than silently hiding or disabling them.
  return approvalStatus === undefined || approvalStatus === null || approvalStatus === '' || approvalStatus === 'approved'
}

export function isScheduleVisibleToStudents(approvalStatus: unknown): boolean {
  // Legacy weeklySchedules have no approval marker and remain live.
  return approvalStatus === undefined || approvalStatus === null || approvalStatus === '' || approvalStatus === 'approved'
}

export function sanitizeScheduleProposalSlot(input: Record<string, unknown>, collegeId: string) {
  const optionalDateKey = (value: unknown, field: string): string => {
    if (value === undefined || value === null || value === '') return ''
    const key = String(value).trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error(`${field} must be a yyyy-mm-dd date`)
    const [year, month, day] = key.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error(`${field} must be a real calendar date`)
    return key
  }
  const effectiveFrom = optionalDateKey(input.effectiveFrom, 'effectiveFrom')
  const effectiveTo = optionalDateKey(input.effectiveTo, 'effectiveTo')
  if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) throw new Error('effectiveTo must be on or after effectiveFrom')
  const required = ['subject', 'facultyId', 'branch', 'batch', 'room', 'dayOfWeek', 'startTime', 'endTime']
  for (const field of required) {
    if (!String(input[field] ?? '').trim()) throw new Error(`${field} is required`)
  }
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayOfWeek = String(input.dayOfWeek).trim().toLowerCase()
  if (!days.includes(dayOfWeek)) throw new Error('dayOfWeek is invalid')
  const time = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!time.test(String(input.startTime)) || !time.test(String(input.endTime)) || String(input.startTime) >= String(input.endTime)) {
    throw new Error('Class start/end times are invalid')
  }
  const semester = Number(input.semester)
  if (!Number.isInteger(semester) || semester < 1 || semester > 20) throw new Error('semester is invalid')
  return {
    collegeId,
    subject: String(input.subject).trim().slice(0, 160),
    subjectCode: String(input.subjectCode || '').trim().slice(0, 50),
    facultyId: String(input.facultyId).trim().slice(0, 160),
    facultyName: String(input.facultyName || '').trim().slice(0, 160),
    branch: String(input.branch).trim().slice(0, 100),
    batch: String(input.batch).trim().slice(0, 40),
    semester,
    division: String(input.division || '').trim().slice(0, 80),
    section: String(input.section || '').trim().slice(0, 80),
    room: String(input.room).trim().slice(0, 80),
    dayOfWeek,
    startTime: String(input.startTime),
    endTime: String(input.endTime),
    type: String(input.type || 'lecture').trim().slice(0, 40),
    ...(effectiveFrom ? { effectiveFrom } : {}),
    ...(effectiveTo ? { effectiveTo } : {}),
    ...(input.autoScheduled === true ? { autoScheduled: true } : {}),
    ...(input.mappingId ? { mappingId: String(input.mappingId).slice(0, 160) } : {}),
    ...(input.demandKey ? { demandKey: String(input.demandKey).slice(0, 300) } : {}),
    ...(input.meetingKey ? { meetingKey: String(input.meetingKey).slice(0, 200) } : {}),
    ...(Array.isArray(input.moduleQueue) ? { moduleQueue: input.moduleQueue.slice(0, 100).map((item) => String(item).slice(0, 100)) } : {}),
    isActive: true,
  }
}
