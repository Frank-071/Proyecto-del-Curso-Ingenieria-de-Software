"use client";

import { create } from "zustand";
import type { CartTicket } from "./cart-store";

interface BuyNowStore {
  items: CartTicket[];
  setItems: (items: CartTicket[]) => void;
  clear: () => void;
}

export const useBuyNowStore = create<BuyNowStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  clear: () => set({ items: [] }),
}));

