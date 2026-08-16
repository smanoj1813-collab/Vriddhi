// generate-routes.cjs
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');
const modulesPath = path.join(srcPath, 'modules');

// Roles to process
const roles = ['auth', 'student', 'faculty', 'admin', 'hod', 'superadmin'];

// Convert PascalCase filename to kebab-case path segment
function toKebab(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// Smart path mapping from page name
function getRoutePath(pageName, role) {
  const base = pageName.replace(/\.tsx$/, '');
  
  // Auth special cases
  if (role === 'auth') {
    if (base === 'Login') return { path: 'login', isIndex: false };
    if (base === 'StudentLogin') return { path: 'login/student', isIndex: false };
    if (base === 'Unauthorized') return { path: 'unauthorized', isIndex: false };
    return { path: toKebab(base), isIndex: false };
  }
  
  // SuperAdmin special cases
  if (role === 'superadmin') {
    if (base === 'SuperAdminDashboard') return { path: 'dashboard', isIndex: true };
    if (base === 'SuperAdminColleges') return { path: 'colleges', isIndex: false };
    if (base === 'CreateCollege') return { path: 'colleges/new', isIndex: false };
    if (base === 'SuperAdminCollegeDetail') return { path: 'colleges/:id', isIndex: false };
    if (base === 'SuperAdminAdmins') return { path: 'admins', isIndex: false };
    if (base === 'CreateCollegeAdmin') return { path: 'admins/new', isIndex: false };
    if (base === 'SuperAdminFaculty') return { path: 'faculty', isIndex: false };
    if (base === 'SuperAdminFacultyDetail') return { path: 'faculty/:id', isIndex: false };
    if (base === 'SuperAdminStudents') return { path: 'students', isIndex: false };
    if (base === 'UserImport') return { path: 'students/import', isIndex: false };
    if (base === 'FacultyImport') return { path: 'faculty/import', isIndex: false };
    if (base === 'SuperAdminCurriculum') return { path: 'curriculum', isIndex: false };
    if (base === 'SuperAdminUniversities') return { path: 'universities', isIndex: false };
    if (base === 'SuperAdminUniversityDetail') return { path: 'universities/:id', isIndex: false };
    if (base === 'MultiCollegeComparison') return { path: 'comparison', isIndex: false };
    if (base === 'SubscriptionBilling') return { path: 'billing', isIndex: false };
    if (base === 'SystemHealthMonitor') return { path: 'health', isIndex: false };
    return { path: toKebab(base.replace(/^SuperAdmin/, '')), isIndex: false };
  }
  
  // Admin special cases
  if (role === 'admin') {
    if (base === 'AdminDashboard' || base === 'Dashboard') return { path: 'dashboard', isIndex: true };
    if (base === 'HODDashboard') return { path: 'hod-dashboard', isIndex: false };
    if (base === 'AdminClassSchedule') return { path: 'schedule', isIndex: false };
    if (base === 'AdminCurriculum') return { path: 'curriculum', isIndex: false };
    if (base === 'AdminFeeManagement') return { path: 'fees', isIndex: false };
    if (base === 'AIAgentPage') return { path: 'ai-agent', isIndex: false };
    if (base === 'Analytics') return { path: 'analytics', isIndex: false };
    if (base === 'Assessments') return { path: 'assessments', isIndex: false };
    if (base === 'CollegeOnboarding') return { path: 'onboarding', isIndex: false };
    if (base === 'Curriculum') return { path: 'curriculum', isIndex: false };
    if (base === 'Journey') return { path: 'journey', isIndex: false };
    if (base === 'PaperBuilder') return { path: 'papers/builder', isIndex: false };
    if (base === 'PaperGeneratorAdmin') return { path: 'papers/generator', isIndex: false };
    if (base === 'QuestionBank') return { path: 'question-bank', isIndex: false };
    if (base === 'Settings') return { path: 'settings', isIndex: false };
    if (base === 'View360') return { path: 'view-360', isIndex: false };
    return { path: toKebab(base.replace(/^Admin/, '')), isIndex: false };
  }
  
  // Faculty special cases
  if (role === 'faculty') {
    if (base === 'FacultyDashboard') return { path: 'dashboard', isIndex: true };
    if (base === 'FacultyAttendance') return { path: 'attendance', isIndex: false };
    if (base === 'Attendance') return { path: 'attendance/mark', isIndex: false };
    if (base === 'FacultyAnnouncements') return { path: 'announcements', isIndex: false };
    if (base === 'FacultyAssignments') return { path: 'assignments', isIndex: false };
    if (base === 'FacultyCalendar') return { path: 'calendar', isIndex: false };
    if (base === 'FacultyCurriculum') return { path: 'curriculum', isIndex: false };
    if (base === 'FacultyLibrary') return { path: 'library', isIndex: false };
    if (base === 'FacultyPaperGenerator') return { path: 'papers/generator', isIndex: false };
    if (base === 'FacultyPapers') return { path: 'papers', isIndex: false };
    if (base === 'FacultyQuestionBank') return { path: 'question-bank', isIndex: false };
    if (base === 'FacultyReschedule') return { path: 'schedule/reschedule', isIndex: false };
    if (base === 'FacultySchedule') return { path: 'schedule', isIndex: false };
    if (base === 'FacultyStudentAnalysis') return { path: 'analysis', isIndex: false };
    if (base === 'FacultyTopics') return { path: 'topics', isIndex: false };
    if (base === 'FacultyUploadMaterial') return { path: 'materials/upload', isIndex: false };
    if (base === 'PaperGenerator') return { path: 'papers/builder', isIndex: false };
    return { path: toKebab(base.replace(/^Faculty/, '')), isIndex: false };
  }
  
  // Student special cases
  if (role === 'student') {
    if (base === 'StudentDashboard') return { path: 'dashboard', isIndex: true };
    if (base === 'StudentEvents') return { path: 'events', isIndex: false };
    if (base === 'StudentFeePortal') return { path: 'fees', isIndex: false };
    if (base === 'StudentGrades') return { path: 'grades', isIndex: false };
    if (base === 'StudentLibrary') return { path: 'library', isIndex: false };
    if (base === 'StudentMaterials') return { path: 'materials', isIndex: false };
    if (base === 'StudentNotificationsPage') return { path: 'notifications', isIndex: false };
    if (base === 'Students') return { path: 'directory', isIndex: false };
    if (base === 'StudentSettings') return { path: 'settings', isIndex: false };
    if (base === 'StudentTestDashboard') return { path: 'tests', isIndex: false };
    if (base === 'StudentTimetable') return { path: 'timetable', isIndex: false };
    if (base === 'ActiveTestPage') return { path: 'tests/active', isIndex: false };
    if (base === 'TestInstructionsPage') return { path: 'tests/instructions', isIndex: false };
    if (base === 'TestResultPage') return { path: 'tests/results', isIndex: false };
    return { path: toKebab(base.replace(/^Student/, '')), isIndex: false };
  }
  
  // HOD
  if (role === 'hod') {
    return { path: toKebab(base), isIndex: false };
  }
  
  return { path: toKebab(base), isIndex: false };
}

function generateModuleRoutes(role) {
  const pagesDir = path.join(modulesPath, role, 'pages');
  if (!fs.existsSync(pagesDir)) {
    console.log(`⏭️  modules/${role}/pages/ not found, skipping`);
    return null;
  }
  
  const pages = fs.readdirSync(pagesDir)
    .filter(f => f.endsWith('.tsx') && !f.endsWith('.d.tsx'))
    .sort();
  
  if (pages.length === 0) {
    console.log(`⏭️  modules/${role}/pages/ is empty, skipping`);
    return null;
  }
  
  const imports = [];
  const routeEntries = [];
  
  pages.forEach(page => {
    const componentName = page.replace(/\.tsx$/, '');
    const { path: routePath, isIndex } = getRoutePath(page, role);
    
    imports.push(`const ${componentName} = lazy(() => import('./pages/${componentName}'));`);
    
    if (isIndex) {
      routeEntries.push(`      { index: true, element: <${componentName} /> },`);
    }
    routeEntries.push(`      { path: '${routePath}', element: <${componentName} /> },`);
  });
  
  // Deduplicate route entries
  const uniqueRoutes = [...new Set(routeEntries)];
  
  const routeVarName = `${role}Routes`;
  const routePrefix = role === 'auth' ? '' : `/${role}`;
  
  const content = `import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleRoute } from '@/modules/auth/guards/RoleRoute';

${imports.join('\n')}

export const ${routeVarName}: RouteObject[] = [
  {
    path: '${routePrefix}',
    element: <RoleRoute allowedRoles={['${role}']} />,
    children: [
${uniqueRoutes.join('\n')}
    ],
  },
];
`;

  const outputPath = path.join(modulesPath, role, 'routes.tsx');
  fs.writeFileSync(outputPath, content);
  console.log(`✅ Created modules/${role}/routes.tsx (${pages.length} pages)`);
  
  return routeVarName;
}

// Main execution
console.log('\n=== Generating Module Routes ===\n');

const generatedRoutes = [];
roles.forEach(role => {
  const result = generateModuleRoutes(role);
  if (result) generatedRoutes.push(result);
});

// Generate routes/index.tsx assembler
if (generatedRoutes.length > 0) {
  const assemblerContent = `import type { RouteObject } from 'react-router-dom';
${generatedRoutes.map(r => `import { ${r} } from '@/modules/${r.replace('Routes', '')}/routes';`).join('\n')}

export const appRoutes: RouteObject[] = [
  ...${generatedRoutes.join(',\n  ...')},
];
`;

  const routesIndexPath = path.join(srcPath, 'routes', 'index.tsx');
  fs.writeFileSync(routesIndexPath, assemblerContent);
  console.log(`\n✅ Created routes/index.tsx (assembles ${generatedRoutes.length} modules)`);
}

console.log('\n🎉 Done! Next steps:');
console.log('   1. Review generated routes.tsx files and adjust paths if needed');
console.log('   2. Move RoleRoute to modules/auth/guards/RoleRoute.tsx');
console.log('   3. Update App.tsx to use appRoutes from routes/index.tsx');
console.log('   4. Run: npx tsc --noEmit to check for errors');