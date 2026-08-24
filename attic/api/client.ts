import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_URL
  || 'https://asia-south1-vriddhi-academic.cloudfunctions.net/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach Firebase ID token
apiClient.interceptors.request.use(async (config) => {
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});