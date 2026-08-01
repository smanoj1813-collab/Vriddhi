export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface CollegeOnboardingData {
  collegeId: string;
  collegeName: string;
  adminEmail: string;
  steps: OnboardingStep[];
  currentStep: number;
  status: "pending" | "in_progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingConfig {
  steps: OnboardingStep[];
  requiredFields: string[];
}
