// src/modules/student/api/testApi.ts
import { db } from "@/Firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import type {
  StudentTestCard,
  TestResultDetail,
  TestResultSummary,
  ActiveTest,
  PaperQuestion,
  StudentTestStatus,
  TestStatus,
} from "../types/assessment";

/* ─── helpers ─── */
const VALID_QUESTION_TYPES: PaperQuestion["type"][] = [
  "mcq", "true_false", "fill_in_blank", "short_answer", "long_answer",
  "numerical", "assertion_reason", "case_based", "matching",
];

function toQuestionType(raw: unknown): PaperQuestion["type"] {
  const s = String(raw || "").toLowerCase().replace(/\s+/g, "_");
  if (VALID_QUESTION_TYPES.includes(s as PaperQuestion["type"])) return s as PaperQuestion["type"];
  return "mcq";
}

function toDifficulty(raw: unknown): PaperQuestion["difficulty"] {
  const s = String(raw || "medium").toLowerCase();
  if (s === "easy" || s === "medium" || s === "hard") return s;
  return "medium";
}

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as any).toDate().toISOString();
  }
  return String(value || "");
}

/* ═══════════════════════════════════════════════════════════════════
   READ: Scheduled Tests + Completed Results
   ═══════════════════════════════════════════════════════════════════ */
export async function fetchScheduledTests(
  collegeId: string,
  studentId: string
): Promise<{ upcoming: StudentTestCard[]; completed: TestResultSummary[] }> {
  if (!collegeId || !studentId) return { upcoming: [], completed: [] };

  const subQ = query(
    collection(db, "studentSubmissions"),
    where("collegeId", "==", collegeId),
    where("studentId", "==", studentId),
    limit(200)
  );
  const subSnap = await getDocs(subQ);
  const subMap = new Map<string, any>();
  subSnap.docs.forEach((d) => {
    const data = d.data();
    subMap.set(String(data.testId || data.assessmentId), data);
  });

  let snap;
  try {
    const q = query(
      collection(db, "scheduledTests"),
      where("collegeId", "==", collegeId),
      where("studentIds", "array-contains", studentId),
      orderBy("startDateTime", "asc"),
      limit(200)
    );
    snap = await getDocs(q);
  } catch {
    const q = query(
      collection(db, "scheduledTests"),
      where("collegeId", "==", collegeId),
      orderBy("startDateTime", "asc"),
      limit(200)
    );
    snap = await getDocs(q);
  }

  const now = Date.now();
  const upcoming: StudentTestCard[] = [];
  const completed: TestResultSummary[] = [];

  snap.docs.forEach((d) => {
    const data = d.data();
    const startTime = toIso(data.startDateTime);
    const endTime = toIso(data.endDateTime);
    const startMs = new Date(startTime).getTime();
    const endMs = endTime
      ? new Date(endTime).getTime()
      : startMs + (data.duration || 0) * 60_000;

    const rawStatus = String(data.status || "");
    let status: TestStatus = "upcoming";
    if (rawStatus === "scheduled") status = now < startMs ? "upcoming" : "available";
    else if (rawStatus === "published") status = "available";
    else if (rawStatus === "active") status = "ongoing";
    else if (rawStatus === "completed") status = "completed";
    else if (rawStatus === "graded") status = "graded";
    else if (rawStatus === "cancelled") status = "missed";
    else {
      if (now < startMs) status = "upcoming";
      else if (now >= startMs && now <= endMs) status = "ongoing";
      else if (now > endMs) status = "completed";
    }

    const sub = subMap.get(d.id);
    let studentStatus: StudentTestStatus = "not_started";
    if (sub) {
      const s = String(sub.status || "");
      if (s === "graded") studentStatus = "graded";
      else if (s === "submitted") studentStatus = "submitted";
      else if (s === "in_progress") studentStatus = "in_progress";
      else if (s === "absent") studentStatus = "absent";
    } else if (status === "completed" || status === "graded") {
      studentStatus = "absent";
    }

    const canStart =
      (status === "upcoming" || status === "available" || status === "ongoing") &&
      (studentStatus === "not_started" || studentStatus === "in_progress");

    const card: StudentTestCard = {
      id: d.id,
      assessmentId: d.id,
      title: String(data.title || ""),
      subject: String(data.subject || ""),
      courseCode: data.courseCode ? String(data.courseCode) : undefined,
      courseName: data.courseName ? String(data.courseName) : undefined,
      totalMarks: data.totalMarks || 0,
      duration: data.duration || 0,
      startDateTime: startTime,
      endDateTime: endTime || new Date(endMs).toISOString(),
      status,
      studentStatus,
      canStart,
      instructions: Array.isArray(data.instructions) ? data.instructions : [],
      totalQuestions: data.totalQuestions || 0,
      paperId: String(data.paperId || d.id),
      collegeId: String(data.collegeId || collegeId),
      branch: String(data.branch || ""),
      batch: String(data.batch || ""),
      semester: typeof data.semester === "number" ? data.semester : 0,
      division: data.division ? String(data.division) : undefined,
      section: data.section ? String(data.section) : undefined,
    };

    if (status === "completed" || status === "graded" || status === "missed") {
      if (sub && sub.status !== "absent") {
        completed.push({
          studentAssessmentId: String(sub.studentAssessmentId || `${d.id}_${studentId}`),
          assessmentId: d.id,
          testId: d.id,
          title: card.title,
          subject: card.subject,
          totalMarks: card.totalMarks,
          marksObtained: sub.score || sub.marksObtained || 0,
          score: sub.score || sub.marksObtained || 0,
          percentage: sub.percentage || 0,
          grade: String(sub.grade || ""),
          gradePoint: sub.gradePoint || 0,
          timeSpent: sub.timeTaken || sub.timeSpent || 0,
          totalQuestions: card.totalQuestions,
          answeredCount: sub.answeredCount || 0,
          correctCount: sub.correctCount || 0,
          incorrectCount: sub.incorrectCount || 0,
          unattemptedCount: sub.unattemptedCount || 0,
          sectionWise: Array.isArray(sub.sectionWise) ? sub.sectionWise : [],
          questionResults: Array.isArray(sub.questionResults) ? sub.questionResults : [],
          rank: sub.rank || 0,
          totalStudents: sub.totalStudents || 0,
          facultyFeedback: sub.facultyFeedback ? String(sub.facultyFeedback) : undefined,
          submittedAt: toIso(sub.submittedAt),
          completedAt: toIso(sub.submittedAt),
          gradedAt: sub.gradedAt ? toIso(sub.gradedAt) : undefined,
        });
      }
    } else {
      upcoming.push(card);
    }
  });

  return { upcoming, completed };
}

/* ═══════════════════════════════════════════════════════════════════
   READ: Test Result Detail
   ═══════════════════════════════════════════════════════════════════ */
export async function fetchTestResult(
  collegeId: string,
  testId: string,
  studentId: string
): Promise<TestResultDetail | null> {
  if (!collegeId || !testId || !studentId) return null;

  const resultQ = query(
    collection(db, "testResults"),
    where("collegeId", "==", collegeId),
    where("testId", "==", testId),
    where("studentId", "==", studentId),
    limit(1)
  );
  const resultSnap = await getDocs(resultQ);
  if (resultSnap.empty) return null;

  const r = resultSnap.docs[0].data();

  const testRef = doc(db, "scheduledTests", testId);
  const testSnap = await getDoc(testRef);
  const testData = testSnap.exists() ? testSnap.data() : {};

  const lbQ = query(
    collection(db, "testResults"),
    where("collegeId", "==", collegeId),
    where("testId", "==", testId),
    orderBy("percentage", "desc"),
    limit(100)
  );
  const lbSnap = await getDocs(lbQ);

  const totalMarks = r.totalMarks || testData.totalMarks || 1;
  const marksObtained = r.score || r.marksObtained || 0;
  const percentage = r.percentage || Math.round((marksObtained / totalMarks) * 100);

  const detail: TestResultDetail = {
    studentAssessmentId: String(r.studentAssessmentId || `${testId}_${studentId}`),
    assessmentId: testId,
    title: String(r.title || testData.title || ""),
    subject: String(r.subject || testData.subject || ""),
    totalMarks,
    marksObtained,
    percentage,
    grade: String(r.grade || ""),
    gradePoint: r.gradePoint || 0,
    timeSpent: r.timeTaken || r.timeSpent || 0,
    totalQuestions: r.totalQuestions || testData.totalQuestions || 0,
    answeredCount: r.answeredCount || 0,
    correctCount: r.correctCount || 0,
    incorrectCount: r.incorrectCount || 0,
    unattemptedCount: r.unattemptedCount || 0,
    sectionScores: Array.isArray(r.sectionScores)
      ? r.sectionScores.map((s: any) => ({
          sectionName: String(s.sectionName || s.sectionId || ""),
          total: s.total || 0,
          correct: s.correct || 0,
          incorrect: s.incorrect || 0,
          score: s.score || s.marksObtained || 0,
          totalMarks: s.totalMarks || 0,
          percentage: s.percentage || 0,
          timeTaken: s.timeTaken || 0,
          accuracy: s.accuracy || 0,
        }))
      : [],
    questionResults: Array.isArray(r.questionResults)
      ? r.questionResults.map((q: any) => ({
          questionId: String(q.questionId || ""),
          questionText: String(q.questionText || q.text || ""),
          questionType: q.questionType ? String(q.questionType) : undefined,
          marks: q.marks || 0,
          options: Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : undefined,
          correctAnswer: q.correctAnswer !== undefined ? String(q.correctAnswer) : undefined,
          studentAnswer: q.studentAnswer !== undefined ? String(q.studentAnswer) : undefined,
          isCorrect: Boolean(q.isCorrect),
          isAttempted: Boolean(q.isAttempted),
          explanation: q.explanation ? String(q.explanation) : undefined,
        }))
      : [],
    leaderboard: lbSnap.docs.map((d, idx) => {
      const ld = d.data();
      return {
        studentId: String(ld.studentId || d.id),
        studentName: String(ld.studentName || "Student"),
        avatar: ld.avatar ? String(ld.avatar) : undefined,
        rank: idx + 1,
        score: ld.score || ld.marksObtained || 0,
        totalMarks: ld.totalMarks || totalMarks,
        percentage: ld.percentage || 0,
        timeTaken: ld.timeTaken || ld.timeSpent || 0,
        isPassed: ld.isPassed ?? (ld.percentage || 0) >= 40,
        isCurrentUser: String(ld.studentId) === studentId,
      };
    }),
    rank: r.rank || 0,
    totalStudents: r.totalStudents || lbSnap.docs.length || 0,
    facultyFeedback: r.facultyFeedback ? String(r.facultyFeedback) : undefined,
    submittedAt: toIso(r.submittedAt || r.completedAt),
    gradedAt: r.gradedAt ? toIso(r.gradedAt) : undefined,
    passingPercentage: r.passingPercentage || 40,
    percentile: r.percentile || 0,
    completedAt: toIso(r.completedAt || r.submittedAt),
    flaggedCount: r.flaggedCount || 0,
  };

  return detail;
}

/* ═══════════════════════════════════════════════════════════════════
   READ: Active Test (questions)
   ═══════════════════════════════════════════════════════════════════ */
export async function fetchActiveTest(
  collegeId: string,
  testId: string
): Promise<ActiveTest | null> {
  if (!collegeId || !testId) return null;

  const testRef = doc(db, "scheduledTests", testId);
  const testSnap = await getDoc(testRef);
  if (!testSnap.exists()) return null;

  const testData = testSnap.data();
  if (String(testData.collegeId) !== collegeId) return null;

  let questions: PaperQuestion[] = [];

  if (Array.isArray(testData.questions) && testData.questions.length > 0) {
    questions = testData.questions.map((q: any, idx: number) => ({
      id: String(q.id || q.questionId || `q-${idx}`),
      questionId: String(q.questionId || q.id || `q-${idx}`),
      order: typeof q.order === "number" ? q.order : idx,
      marks: q.marks || 1,
      text: String(q.text || q.questionText || ""),
      type: toQuestionType(q.type || q.questionType),
      difficulty: toDifficulty(q.difficulty),
      options: Array.isArray(q.options)
        ? q.options.map((o: any, i: number) =>
            typeof o === "string"
              ? { id: `opt-${i}`, text: o }
              : { id: String(o.id || `opt-${i}`), text: String(o.text || o.label || "") }
          )
        : undefined,
      hasImage: Boolean(q.imageUrl || q.hasImage),
      imageUrl: q.imageUrl ? String(q.imageUrl) : undefined,
      sectionId: q.sectionId ? String(q.sectionId) : undefined,
      sectionName: q.sectionName ? String(q.sectionName) : undefined,
      negativeMarks: typeof q.negativeMarks === "number" ? q.negativeMarks : undefined,
      questionText: String(q.questionText || q.text || ""),
      questionType: String(q.questionType || q.type || "mcq"),
    }));
  } else {
    const qSnap = await getDocs(
      collection(db, "scheduledTests", testId, "assessmentQuestions")
    );
    questions = qSnap.docs.map((d, idx) => {
      const dq = d.data();
      return {
        id: d.id,
        questionId: d.id,
        order: typeof dq.order === "number" ? dq.order : idx,
        marks: dq.marks || 1,
        text: String(dq.text || dq.questionText || ""),
        type: toQuestionType(dq.type || dq.questionType),
        difficulty: toDifficulty(dq.difficulty),
        options: Array.isArray(dq.options)
          ? dq.options.map((o: any, i: number) =>
              typeof o === "string"
                ? { id: `opt-${i}`, text: o }
                : { id: String(o.id || `opt-${i}`), text: String(o.text || o.label || "") }
            )
          : undefined,
        hasImage: Boolean(dq.imageUrl || dq.hasImage),
        imageUrl: dq.imageUrl ? String(dq.imageUrl) : undefined,
        sectionId: dq.sectionId ? String(dq.sectionId) : undefined,
        sectionName: dq.sectionName ? String(dq.sectionName) : undefined,
        negativeMarks: typeof dq.negativeMarks === "number" ? dq.negativeMarks : undefined,
        questionText: String(dq.questionText || dq.text || ""),
        questionType: String(dq.questionType || dq.type || "mcq"),
      };
    });
  }

  const duration = testData.duration || 0;

  return {
    studentAssessmentId: `${testId}_active`,
    assessmentId: testId,
    paperId: String(testData.paperId || testId),
    title: String(testData.title || ""),
    subject: String(testData.subject || ""),
    totalMarks: testData.totalMarks || 0,
    duration,
    startedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + duration * 60_000).toISOString(),
    questions,
    flaggedQuestions: [],
    instructions: Array.isArray(testData.instructions) ? testData.instructions : [],
    negativeMarking: Boolean(testData.negativeMarking),
    collegeId: String(testData.collegeId || collegeId),
    totalQuestions: questions.length,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   WRITE: Save submission
   ═══════════════════════════════════════════════════════════════════ */
export async function saveStudentSubmission(
  collegeId: string,
  testId: string,
  studentId: string,
  studentName: string,
  studentRegNo: string,
  answers: Record<string, any>,
  timeRemaining: number,
  proctorEvents: any[]
): Promise<void> {
  await addDoc(collection(db, "studentSubmissions"), {
    collegeId,
    testId,
    studentId,
    studentName,
    studentRegNo,
    answers,
    timeRemaining,
    proctorEvents,
    status: "submitted",
    submittedAt: serverTimestamp(),
  });
}

/* ═══════════════════════════════════════════════════════════════════
   WRITE: Proctor event
   ═══════════════════════════════════════════════════════════════════ */
export async function logProctorEvent(
  collegeId: string,
  testId: string,
  studentId: string,
  event: { type: string; details?: Record<string, unknown> }
): Promise<void> {
  await addDoc(collection(db, "proctoringLogs"), {
    collegeId,
    testId,
    studentId,
    ...event,
    timestamp: serverTimestamp(),
  });
}