import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// ── Request interceptor: attach Bearer token ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('edutokens') || 'null');
    if (tokens?.access) {
      config.headers['Authorization'] = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 (token expired) ────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const tokens = JSON.parse(localStorage.getItem('edutokens') || 'null');
        if (tokens?.refresh) {
          // ✅ Use the correct SimpleJWT refresh endpoint
          const { data } = await axios.post(
            'http://127.0.0.1:8000/api/auth/token/refresh/',
            { refresh: tokens.refresh }
          );
          // SimpleJWT /token/refresh/ returns { access } (and new refresh if ROTATE_REFRESH_TOKENS=True)
          const newTokens = {
            access:  data.access,
            refresh: data.refresh ?? tokens.refresh,
          };
          localStorage.setItem('edutokens', JSON.stringify(newTokens));
          original.headers['Authorization'] = `Bearer ${data.access}`;
          return api(original);
        }
      } catch (_) {
        localStorage.removeItem('edutokens');
        localStorage.removeItem('eduuser');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


export default api;
