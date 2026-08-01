const admin = require('firebase-admin');

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION - Update these values
// ═══════════════════════════════════════════════════════════════════════

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';  // Download from Firebase Console → Project Settings → Service Accounts
const SUPER_ADMIN_EMAIL = 'superadmin@vriddhi.edu';
const SUPER_ADMIN_PASSWORD = 'superadmin123';  // ⚠️ CHANGE THIS!
const SUPER_ADMIN_NAME = 'Super Admin';
const COLLEGE_ID = 'NhARL0kWJof1JbnLGijV';

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZE FIREBASE ADMIN
// ═══════════════════════════════════════════════════════════════════════

try {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:');
  console.error('   Make sure you have downloaded your service account key from Firebase Console');
  console.error('   Path expected:', SERVICE_ACCOUNT_PATH);
  console.error('   Error:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

async function checkCollectionExists(collectionName) {
  const snapshot = await db.collection(collectionName).limit(1).get();
  return !snapshot.empty;
}

async function findUserByEmail(collectionName, email) {
  const query = await db.collection(collectionName)
    .where('email', '==', email.toLowerCase().trim())
    .get();

  if (query.empty) return null;

  const doc = query.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function createSuperAdmin() {
  console.log('\n🔍 Checking if super admin already exists...');

  // Check all collections
  const collections = ['superAdmins', 'admins', 'faculty'];
  let foundIn = null;
  let foundDoc = null;

  for (const collection of collections) {
    const existing = await findUserByEmail(collection, SUPER_ADMIN_EMAIL);
    if (existing) {
      foundIn = collection;
      foundDoc = existing;
      break;
    }
  }

  if (foundIn) {
    console.log(`⚠️  Super admin already exists in "${foundIn}" collection!`);
    console.log('   Document ID:', foundDoc.id);
    console.log('   Email:', foundDoc.email);
    console.log('   Status:', foundDoc.status);
    console.log('   Role:', foundDoc.role || 'N/A');
    console.log('\n💡 If you want to recreate it, delete this document first.');
    return;
  }

  console.log('✅ No existing super admin found. Creating new one...\n');

  // Create in superAdmins collection
  const superAdminData = {
    email: SUPER_ADMIN_EMAIL.toLowerCase().trim(),
    password: SUPER_ADMIN_PASSWORD,
    status: 'active',
    name: SUPER_ADMIN_NAME,
    collegeId: COLLEGE_ID,
    role: 'superadmin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLogin: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const docRef = await db.collection('superAdmins').add(superAdminData);
    console.log('✅ Super admin created successfully!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Document ID :', docRef.id);
    console.log('  Email       :', superAdminData.email);
    console.log('  Name        :', superAdminData.name);
    console.log('  Role        :', superAdminData.role);
    console.log('  Status      :', superAdminData.status);
    console.log('  College ID  :', superAdminData.collegeId);
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Failed to create super admin:', error.message);
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');

  // Check collections
  const collections = ['superAdmins', 'admins', 'faculty'];
  console.log('\n📁 Collections:');
  for (const col of collections) {
    const exists = await checkCollectionExists(col);
    console.log(`   ${exists ? '✅' : '❌'} ${col}`);
  }

  // Check if super admin exists
  const superAdmin = await findUserByEmail('superAdmins', SUPER_ADMIN_EMAIL);
  if (superAdmin) {
    console.log('\n👤 Super Admin Status:');
    console.log('   ✅ Found in superAdmins collection');
    console.log('   ID     :', superAdmin.id);
    console.log('   Email  :', superAdmin.email);
    console.log('   Status :', superAdmin.status);
    console.log('   Role   :', superAdmin.role);
  } else {
    console.log('\n👤 Super Admin Status:');
    console.log('   ❌ Not found in superAdmins collection');
  }

  // Count documents in each collection
  console.log('\n📊 Document Counts:');
  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    console.log(`   ${col}: ${snapshot.size} document(s)`);
  }
}

async function listAllUsers() {
  console.log('\n📋 Listing all users across collections...\n');

  const collections = ['superAdmins', 'admins', 'faculty'];

  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    console.log(`\n📁 ${col} (${snapshot.size} documents):`);

    if (snapshot.empty) {
      console.log('   (empty)');
      continue;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   ┌─ ID: ${doc.id}`);
      console.log(`   │  Email : ${data.email || 'N/A'}`);
      console.log(`   │  Name  : ${data.name || data.firstName + ' ' + data.lastName || 'N/A'}`);
      console.log(`   │  Role  : ${data.role || 'N/A'}`);
      console.log(`   │  Status: ${data.status || 'N/A'}`);
      console.log(`   └─`);
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Vriddhi Firebase Super Admin Setup');
  console.log('═══════════════════════════════════════════════════════════');

  const args = process.argv.slice(2);
  const command = args[0] || 'setup';

  switch (command) {
    case 'setup':
      await createSuperAdmin();
      await verifySetup();
      break;

    case 'verify':
      await verifySetup();
      break;

    case 'list':
      await listAllUsers();
      break;

    case 'help':
    default:
      console.log('\nUsage: node setup-superadmin.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  setup   - Create super admin and verify (default)');
      console.log('  verify  - Verify existing setup');
      console.log('  list    - List all users in all collections');
      console.log('  help    - Show this help message');
      console.log('');
      console.log('Before running:');
      console.log('  1. Download service account key from Firebase Console');
      console.log('     → Project Settings → Service Accounts → Generate new private key');
      console.log('  2. Save it as "serviceAccountKey.json" in this directory');
      console.log('  3. Update SUPER_ADMIN_PASSWORD in this script');
      break;
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});