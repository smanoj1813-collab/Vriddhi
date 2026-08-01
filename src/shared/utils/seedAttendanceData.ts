// ============================================================
// VRIDDHI - Attendance Data Seeder
// ============================================================
// Run this once to populate demo attendance data
// Usage: import { seedAttendanceData } from './seedAttendanceData';
//        await seedAttendanceData('NhARLOkWJof1JbnLGijV');
// ============================================================

import {
  collection, doc, setDoc, writeBatch, Timestamp
} from 'firebase/firestore';
import { db } from '@/Firebase/config';

const BRANCHES = ['BCom', 'BA', 'BSc', 'BBA', 'BCA'];
const BATCHES = ['2022', '2023', '2024', '2025'];
const DIVISIONS = ['A', 'B', 'C'];
const SUBJECTS = [
  { name: 'Mathematics', code: 'MAT101' },
  { name: 'Physics', code: 'PHY101' },
  { name: 'Chemistry', code: 'CHE101' },
  { name: 'English', code: 'ENG101' },
  { name: 'Computer Science', code: 'CS101' },
  { name: 'Economics', code: 'ECO101' },
  { name: 'Accounting', code: 'ACC101' },
  { name: 'Business Management', code: 'BM101' },
];

const STUDENT_NAMES = [
  'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh',
  'Neha Reddy', 'Arjun Nair', 'Divya Iyer', 'Karan Mehta', 'Ananya Desai',
  'Rohit Verma', 'Pooja Shah', 'Siddharth Rao', 'Meera Joshi', 'Aditya Malhotra',
  'Kavya Menon', 'Nikhil Bhat', 'Isha Kaur', 'Varun Pillai', 'Sanya Chopra',
  'Tarun Agarwal', 'Lakshmi Narayan', 'Harish Gowda', 'Fatima Khan', 'Rajesh Yadav',
  'Anjali Mishra', 'Deepak Choudhary', 'Swati Banerjee', 'Manoj Tiwari', 'Ritu Saxena',
];

function generateStudents(branch: string, batch: string, division: string): Array<{
  id: string; name: string; regNo: string; usn: string;
}> {
  const students = [];
  const count = 25 + Math.floor(Math.random() * 15); // 25-40 students per division
  for (let i = 0; i < count; i++) {
    const name = STUDENT_NAMES[i % STUDENT_NAMES.length] + (i >= STUDENT_NAMES.length ? ` ${i}` : '');
    const regNo = `${branch.substring(0, 2).toUpperCase()}${batch}${division}${String(i + 1).padStart(3, '0')}`;
    const usn = `1${branch.substring(0, 1).toUpperCase()}${batch}${String(i + 1).padStart(3, '0')}`;
    students.push({ id: `stu_${branch}_${batch}_${division}_${i}`, name, regNo, usn });
  }
  return students;
}

function randomStatus(presentRate: number = 0.85): string {
  const rand = Math.random();
  if (rand < presentRate) return 'Present';
  if (rand < presentRate + 0.05) return 'Late';
  if (rand < presentRate + 0.05 + 0.03) return 'Leave';
  if (rand < presentRate + 0.05 + 0.03 + 0.02) return 'OnDuty';
  if (rand < presentRate + 0.05 + 0.03 + 0.02 + 0.01) return 'MedicalLeave';
  return 'Absent';
}

/**
 * Seed attendance data for a college
 */
export async function seedAttendanceData(
  collegeId: string,
  options: {
    startDate?: string;
    days?: number;
    clearExisting?: boolean;
  } = {}
): Promise<{ recordsCreated: number; summariesCreated: number }> {
  const { startDate = '2026-07-01', days = 20, clearExisting = false } = options;

  const recordsCreated = 0;
  let summariesCreated = 0;

  console.log(`🌱 Seeding attendance data for college ${collegeId}...`);

  // Generate students for each branch/batch/division combo
  const allStudents: Record<string, ReturnType<typeof generateStudents>> = {};

  for (const branch of BRANCHES) {
    for (const batch of BATCHES) {
      for (const division of DIVISIONS) {
        const key = `${branch}_${batch}_${division}`;
        allStudents[key] = generateStudents(branch, batch, division);
      }
    }
  }

  // Generate data for each day
  const start = new Date(startDate);

  for (let d = 0; d < days; d++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + d);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // For each branch/batch/division, create a session and mark attendance
    for (const branch of BRANCHES) {
      for (const batch of BATCHES) {
        for (const division of DIVISIONS) {
          const key = `${branch}_${batch}_${division}`;
          const students = allStudents[key];
          if (!students || students.length === 0) continue;

          const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
          const sessionId = `sess_${dateStr}_${branch}_${batch}_${division}_${subject.code}`;
          const facultyId = `fac_${Math.floor(Math.random() * 10)}`;
          const facultyName = `Faculty ${Math.floor(Math.random() * 10) + 1}`;

          // Mark attendance for each student
          const batch_write = writeBatch(db);
          let present = 0, absent = 0, late = 0, leave = 0, onDuty = 0, medicalLeave = 0;

          for (const student of students) {
            const status = randomStatus(0.82 + Math.random() * 0.1); // 82-92% present rate
            const recordId = `att_${dateStr}_${student.id}_${sessionId}`;

            const recordRef = doc(db, 'attendanceRecords', recordId);
            batch_write.set(recordRef, {
              collegeId,
              studentId: student.id,
              studentName: student.name,
              sessionId,
              date: dateStr,
              subject: subject.name,
              subjectCode: subject.code,
              status,
              checkInTime: status === 'Present' || status === 'Late' ? `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
              notes: '',
              markedBy: facultyId,
              markedAt: new Date().toISOString(),
              branch,
              batch,
              division,
              usn: student.usn,
              regNo: student.regNo,
              createdAt: Timestamp.now(),
            });

            if (status === 'Present') present++;
            else if (status === 'Absent') absent++;
            else if (status === 'Late') late++;
            else if (status === 'Leave') leave++;
            else if (status === 'OnDuty') onDuty++;
            else if (status === 'MedicalLeave') medicalLeave++;
          }

          await batch_write.commit();

          // Create daily summary
          const total = students.length;
          const summaryId = `sum_${dateStr}_${branch}_${batch}_${division}`;
          const summaryRef = doc(db, 'attendanceSummary', summaryId);
          await setDoc(summaryRef, {
            collegeId,
            date: dateStr,
            branch,
            batch,
            division,
            subject: subject.name,
            subjectCode: subject.code,
            total,
            present,
            absent,
            late,
            leave,
            onDuty,
            medicalLeave,
            percentage: Math.round((present / total) * 100),
            sessions: 1,
            facultyId,
            facultyName,
            createdAt: Timestamp.now(),
          });

          summariesCreated++;
        }
      }
    }

    console.log(`  ✅ ${dateStr}: Created summaries`);
  }

  console.log(`🎉 Done! Created ${summariesCreated} daily summaries.`);
  return { recordsCreated: 0, summariesCreated };
}

/**
 * Quick seed for testing - just today and yesterday
 */
export async function seedQuickAttendance(collegeId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  await seedAttendanceData(collegeId, {
    startDate: yesterday,
    days: 2,
  });
}
