import { create } from "zustand";

export interface State {
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  customerId: string | null;
  setUser: (user: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    customerId: string;
  }) => void;
  resetUser: () => void;
}

export const useStore = create<State>()((set) => ({
  userId: null,
  firstName: null,
  lastName: null,
  email: null,
  customerId: null,

  setUser: ({ userId, firstName, lastName, email, customerId }) => {
    set({ userId, firstName, lastName, email, customerId });
  },

  resetUser: () => {
    set({
      userId: null,
      firstName: null,
      lastName: null,
      email: null,
      customerId: null,
    });
  },
}));
