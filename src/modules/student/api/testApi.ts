import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../Firebase/config';
import type {
  ActiveTest,
  BasicProctorEvent,
  StudentAnswer,
  SubmitOutcome,
  TestInstructionsData,
  TestResultDetail,
} from '../types/assessment';

export interface StudentIdentity {
  id: string;
  name: string;
  regNo: string;
}

export interface StartResult {
  studentAssessmentId: string;
  testId: string;
  startedAt: string;
  endsAt: string;
  resumed: boolean;
}

interface CallableEnvelope<T> {
  data: T;
}

function messageFor(error: unknown, fallback: string): Error {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message || '').replace(/^Firebase:\s*/i, '');
    if (message) return new Error(message);
  }
  return new Error(fallback);
}

async function call<TInput, TOutput>(name: string, input: TInput, fallback: string): Promise<TOutput> {
  try {
    const callable = httpsCallable<TInput, TOutput>(functions, name);
    const response = await callable(input);
    return response.data;
  } catch (error) {
    throw messageFor(error, fallback);
  }
}

export async function fetchTestInstructions(
  _collegeId: string,
  testId: string,
  _studentId: string
): Promise<TestInstructionsData | null> {
  return call<{ testId: string }, TestInstructionsData>(
    'getMyTestInstructions',
    { testId },
    'Could not load the test instructions.'
  );
}

export async function startStudentAssessment(
  _collegeId: string,
  testId: string,
  _student: StudentIdentity
): Promise<StartResult> {
  return call<{ testId: string }, StartResult>(
    'startMyStudentTest',
    { testId },
    'Could not start the test.'
  );
}

export async function fetchActiveTest(
  _collegeId: string,
  testId: string,
  _studentId: string
): Promise<ActiveTest | null> {
  return call<{ testId: string }, ActiveTest>(
    'getMyActiveStudentTest',
    { testId },
    'Could not load the active test.'
  );
}

export async function autosaveStudentAssessment(
  studentAssessmentId: string,
  answers: StudentAnswer[],
  _timeSpent: number,
  _proctorEvents?: BasicProctorEvent[]
): Promise<void> {
  if (!studentAssessmentId) return;
  const keyedAnswers = Object.fromEntries(answers.map((answer) => [answer.questionId, answer]));
  await call<
    { studentAssessmentId: string; answers: Record<string, StudentAnswer> },
    { success: boolean }
  >(
    'autosaveMyStudentTest',
    { studentAssessmentId, answers: keyedAnswers },
    'Answers could not be saved.'
  );
}

export async function submitStudentAssessment(params: {
  collegeId: string;
  testId: string;
  student: StudentIdentity;
  studentAssessmentId: string;
  answers: Record<string, Partial<StudentAnswer>>;
  timeSpent: number;
  proctorEvents: BasicProctorEvent[];
  autoSubmitted?: boolean;
}): Promise<SubmitOutcome> {
  return call<
    {
      testId: string;
      studentAssessmentId: string;
      answers: Record<string, Partial<StudentAnswer>>;
      autoSubmitted: boolean;
    },
    SubmitOutcome
  >(
    'submitMyStudentTest',
    {
      testId: params.testId,
      studentAssessmentId: params.studentAssessmentId,
      answers: params.answers,
      autoSubmitted: Boolean(params.autoSubmitted),
    },
    'The test could not be submitted.'
  );
}

export async function fetchTestResult(
  _collegeId: string,
  testId: string,
  _studentId: string
): Promise<TestResultDetail | null> {
  return call<{ testId: string }, TestResultDetail>(
    'getMyStudentTestResult',
    { testId },
    'This result is not available yet.'
  );
}

export async function logProctorEvent(
  _collegeId: string,
  _testId: string,
  studentAssessmentId: string,
  _studentId: string,
  event: BasicProctorEvent
): Promise<void> {
  await call<
    { studentAssessmentId: string; event: BasicProctorEvent },
    CallableEnvelope<{ success: boolean }> | { success: boolean }
  >(
    'logMyStudentTestEvent',
    { studentAssessmentId, event },
    'Proctoring event could not be recorded.'
  );
}
