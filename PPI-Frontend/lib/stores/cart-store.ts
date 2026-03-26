"use client";

import { create } from "zustand";
import { useCartNotificationStore } from "./cart-notification-store";

export interface CartTicket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  zone: string;
  zoneId?: number;
  price: number;
  quantity: number;
}

export interface CartEvent {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  tickets: CartTicket[];
  totalQuantity: number;
  totalPrice: number;
}

interface CartStore {
  items: CartTicket[];
  isOpen: boolean;
  addToCart: (ticket: Omit<CartTicket, "id">, userId: string) => void;
  removeFromCart: (ticketId: string, userId: string) => void;
  updateQuantity: (ticketId: string, quantity: number, userId: string) => void;
  clearCart: (userId: string) => void;
  loadCart: (userId: string) => void;
  openCart: () => void;
  closeCart: () => void;
  getGroupedByEvent: () => CartEvent[];
  getTotalItems: () => number;
  getTotalPrice: () => number;
  canAddMoreTickets: (quantity: number) => boolean;
  getRemainingTickets: () => number;
}

const CART_PREFIX = "cart_";
const MAX_TICKETS_PER_USER = 4; // Límite máximo de entradas por usuario

const saveCartToStorage = (userId: string, items: CartTicket[]) => {
  const data = { items };
  localStorage.setItem(`${CART_PREFIX}${userId}`, JSON.stringify(data));
};

const loadCartFromStorage = (userId: string): CartTicket[] => {
  const raw = localStorage.getItem(`${CART_PREFIX}${userId}`);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return data.items || [];
  } catch {
    localStorage.removeItem(`${CART_PREFIX}${userId}`);
    return [];
  }
};

const clearCartFromStorage = (userId: string) => {
  localStorage.removeItem(`${CART_PREFIX}${userId}`);
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  addToCart: (ticket, userId) => {
    // Validar límite de entradas
    if (!get().canAddMoreTickets(ticket.quantity)) {
      console.warn(`No se puede agregar. Límite de ${MAX_TICKETS_PER_USER} entradas alcanzado.`);
      return;
    }

    const id = `${ticket.eventId}-${ticket.zone}`;
    const existingItem = get().items.find(
      (item) => item.eventId === ticket.eventId && item.zone === ticket.zone
    );

    const newItems = existingItem
      ? get().items.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + ticket.quantity }
            : item
        )
      : [...get().items, { ...ticket, id }];

    saveCartToStorage(userId, newItems);
    set({ items: newItems });
    
    // Disparar notificación
    useCartNotificationStore.getState().addNotification({
      eventName: ticket.eventName,
      zone: ticket.zone,
      quantity: ticket.quantity,
      price: ticket.price
    });
  },

  removeFromCart: (ticketId, userId) => {
    const newItems = get().items.filter((item) => item.id !== ticketId);
    saveCartToStorage(userId, newItems);
    set({ items: newItems });
  },

  updateQuantity: (ticketId, quantity, userId) => {
    if (quantity <= 0) {
      get().removeFromCart(ticketId, userId);
      return;
    }
    const newItems = get().items.map((item) =>
      item.id === ticketId ? { ...item, quantity } : item
    );
    saveCartToStorage(userId, newItems);
    set({ items: newItems });
  },

  clearCart: (userId) => {
    if (userId) clearCartFromStorage(userId);
    set({ items: [] });
  },

  loadCart: (userId) => {
    if (!userId) return;
    const items = loadCartFromStorage(userId);
    set({ items });
  },

  getGroupedByEvent: () => {
    const grouped = get().items.reduce((acc, item) => {
      if (!acc[item.eventId]) {
        acc[item.eventId] = {
          eventId: item.eventId,
          eventName: item.eventName,
          eventDate: item.eventDate,
          eventVenue: item.eventVenue,
          tickets: [],
          totalQuantity: 0,
          totalPrice: 0,
        };
      }
      acc[item.eventId].tickets.push(item);
      acc[item.eventId].totalQuantity += item.quantity;
      acc[item.eventId].totalPrice += item.price * item.quantity;
      return acc;
    }, {} as Record<string, CartEvent>);
    return Object.values(grouped);
  },

  getTotalItems: () => get().items.reduce((t, i) => t + i.quantity, 0),
  getTotalPrice: () => get().items.reduce((t, i) => t + i.price * i.quantity, 0),
  
  canAddMoreTickets: (quantity) => {
    const currentTotal = get().getTotalItems();
    return currentTotal + quantity <= MAX_TICKETS_PER_USER;
  },
  
  getRemainingTickets: () => {
    const currentTotal = get().getTotalItems();
    return Math.max(0, MAX_TICKETS_PER_USER - currentTotal);
  },
}));
