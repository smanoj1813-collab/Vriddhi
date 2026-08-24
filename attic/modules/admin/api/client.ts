import axios, { AxiosInstance, AxiosResponse } from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://asia-south1-vriddhi-academic.cloudfunctions.net/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL.replace(/\/$/, ''),
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

async function getBearerToken(): Promise<string | null> {
  const stored = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('vriddhi_auth_token');
  if (stored) return stored;

  try {
    const { auth } = await import('@/Firebase/config');
    if (auth.currentUser) return await auth.currentUser.getIdToken();
  } catch {
    // Firebase unavailable in non-browser contexts — fall through.
  }
  return null;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await getBearerToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('vriddhi_auth_token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
