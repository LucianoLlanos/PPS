import { create } from 'zustand';

const useSnackbarStore = create((set) => ({
  open: false,
  message: '',
  severity: 'success',
  duration: 2600,
  show: (message, severity = 'success', duration = 2600) => set({ open: true, message, severity, duration }),
  hide: () => set({ open: false }),
}));

export default useSnackbarStore;
