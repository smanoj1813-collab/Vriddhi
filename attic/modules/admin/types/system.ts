export interface OnboardingState {
  step: number
  collegeId?: string
  completed: boolean
}

export type OnboardingStatus = 'pending' | 'in-progress' | 'completed' | 'failed'

export interface SystemConfig {
  id: string
  key: string
  value: string | number | boolean
  updatedAt?: string
}