"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.rtdb = exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const database_1 = require("firebase-admin/database");
const auth_1 = require("firebase-admin/auth");
// Use require for path to avoid esModuleInterop runtime issues
const path = require('path');
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)(serviceAccount),
        databaseURL: 'https://vriddhi-academic-default-rtdb.asia-southeast1.firebasedatabase.app',
    });
}
exports.db = (0, firestore_1.getFirestore)();
exports.rtdb = (0, database_1.getDatabase)();
exports.auth = (0, auth_1.getAuth)();
//# sourceMappingURL=firebase.js.map