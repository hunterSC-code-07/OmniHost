import { create } from 'zustand';

interface LogMessage {
  id: string;
  msg: string;
}

interface LogStore {
  logs: LogMessage[];
  addLogs: (id: string, msgs: string[]) => void;
  clearLogs: (id?: string) => void;
  setLogs: (logs: LogMessage[]) => void;
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  setLogs: (logs) => set({ logs }),
  addLogs: (id, msgs) => set((state) => {
    const newLogs = [...state.logs, ...msgs.map(m => ({ id, msg: m }))];
    if (newLogs.length > 500) return { logs: newLogs.slice(newLogs.length - 500) };
    return { logs: newLogs };
  }),
  clearLogs: (id) => set((state) => {
    if (id) {
      return { logs: state.logs.filter(l => l.id !== id) };
    }
    return { logs: [] };
  })
}));
