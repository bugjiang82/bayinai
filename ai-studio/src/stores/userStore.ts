import { create } from "zustand";

interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role?: string;
}

interface UserState {
  user: UserInfo | null;
  credits: number;
  isAuthenticated: boolean;

  setUser: (user: UserInfo | null) => void;
  setCredits: (credits: number) => void;
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  credits: 0,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setCredits: (credits) =>
    set({ credits }),

  addCredits: (amount) =>
    set((state) => ({
      credits: Math.max(0, state.credits + amount),
    })),

  deductCredits: (amount) =>
    set((state) => ({
      credits: Math.max(0, state.credits - amount),
    })),

  logout: () =>
    set({
      user: null,
      credits: 0,
      isAuthenticated: false,
    }),
}));
