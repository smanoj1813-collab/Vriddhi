const fs = require('fs');
const path = require('path');

function rewriteAuthRoutes() {
  const fp = path.join(__dirname, 'src/modules/auth/routes.tsx');
  const content = `import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Login = lazy(() => import('./pages/Login'));
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

export const authRoutes: RouteObject[] = [
  { path: 'login', element: <Login /> },
  { path: 'login/student', element: <StudentLogin /> },
  { path: 'unauthorized', element: <Unauthorized /> },
];
`;
  fs.writeFileSync(fp, content);
  console.log('✅ auth/routes.tsx — public routes (no RoleRoute)');
}

function fixRoleRoutes(role, prefix) {
  const fp = path.join(__dirname, `src/modules/${role}/routes.tsx`);
  let content = fs.readFileSync(fp, 'utf8');
  
  // Add Outlet import if missing
  if (!content.includes('import { Outlet }')) {
    content = content.replace(
      "import type { RouteObject } from 'react-router-dom';",
      "import { Outlet } from 'react-router-dom';\nimport type { RouteObject } from 'react-router-dom';"
    );
  }
  
  // Fix RoleRoute to wrap Outlet
  content = content.replace(
    `element: <RoleRoute allowedRoles={['${role}']} />`, 
    `element: <RoleRoute allowedRoles={['${role}']}><Outlet /></RoleRoute>`
  );
  
  fs.writeFileSync(fp, content);
  console.log(`✅ ${role}/routes.tsx — RoleRoute wraps Outlet`);
}

rewriteAuthRoutes();
fixRoleRoutes('admin', '/admin');
fixRoleRoutes('faculty', '/faculty');
fixRoleRoutes('student', '/student');
fixRoleRoutes('superadmin', '/superadmin');

console.log('\n🎉 All route structures fixed.');