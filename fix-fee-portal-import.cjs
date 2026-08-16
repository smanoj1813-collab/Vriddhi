const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/modules/student/pages/StudentFeePortal.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix path: contexts -> context
content = content.replace(
  "@/modules/auth/contexts/AuthContext",
  "@/modules/auth/context/AuthContext"
);

fs.writeFileSync(file, content);
console.log('✅ Fixed import path: @/modules/auth/context/AuthContext');