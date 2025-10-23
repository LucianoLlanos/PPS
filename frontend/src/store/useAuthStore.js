import { create } from 'zustand';

const getInitialUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    /* ignore */
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setAuth: (user, token) => {
    try {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
  } catch { /* ignore */ }
    set({ user, token });
  },
  clearAuth: () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
  } catch { /* ignore */ }
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
