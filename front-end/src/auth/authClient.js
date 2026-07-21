import axios from 'axios';

const TOKEN_KEY = 'authToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  delete axios.defaults.headers.common['Authorization'];
}

export function isAuthenticated() {
  return !!getToken();
}

// Re-applies a saved token to axios on app startup (page refresh loses in-memory headers)
// and sends expired/invalid sessions back to the login page.
export function hydrateAuth() {
  const token = getToken();
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && getToken()) {
        clearToken();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

export async function login(password) {
  const baseURL = import.meta.env.VITE_API_URL;
  const res = await axios.post(`${baseURL}/api/auth/login`, { password });
  setToken(res.data.token);
}

export function logout() {
  clearToken();
}
