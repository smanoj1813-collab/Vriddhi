import { Chip } from '@mui/material'
import { isMergedDivision, mergedDivisionLabel } from '../utils/divisionGroups'

interface Props {
  division?: string | null
  /** Optional roster count; callers without a count still show the merged scope. */
  studentCount?: number
  size?: 'small' | 'medium'
}

export default function MergedDivisionChip({ division, studentCount, size = 'small' }: Props) {
  if (!isMergedDivision(division)) return null
  const suffix = Number.isFinite(studentCount) ? ` (${studentCount} students)` : ''
  return (
    <Chip
      size={size}
      color="secondary"
      variant="outlined"
      label={`Merged class · ${mergedDivisionLabel(division)}${suffix}`}
      sx={{ maxWidth: '100%' }}
    />
  )
}
