import { create } from 'zustand';

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

interface ConnectionState {
  status: ConnectionStatus;
  reconnectAttempts: number;
  setStatus: (status: ConnectionStatus) => void;
  setReconnectAttempts: (n: number) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'connecting',
  reconnectAttempts: 0,
  setStatus: (status) => set({ status }),
  setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),
}));
