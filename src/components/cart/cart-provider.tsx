"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { withoutPreview, type CartItem, type Personalization } from "@/lib/types";

const STORAGE_KEY = "minnie_cart_v1";
const CHANGE_EVENT = "minnie-cart-change";

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  add: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(productId: number, options: Record<string, string>, p?: Personalization) {
  return `${productId}:${JSON.stringify(options)}:${JSON.stringify(withoutPreview(p ?? {}))}`;
}

// Only keeps entries with the expected shape; anything else in storage is dropped.
function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((i) => {
    if (
      !i ||
      typeof i.productId !== "number" ||
      typeof i.quantity !== "number" ||
      typeof i.options !== "object"
    ) {
      return [];
    }
    const quantity = Math.min(99, Math.max(1, Math.round(i.quantity)));
    return [{ ...i, quantity, key: itemKey(i.productId, i.options, i.personalization) }];
  });
}

// localStorage as an external store: same-tab changes fire CHANGE_EVENT,
// other tabs fire "storage".
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

// null on the server and during hydration, so the first client render matches.
const getServerSnapshot = () => null;

function writeItems(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode): nothing persists, but nothing breaks.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const ready = raw !== null;

  const items = useMemo(() => {
    if (!raw) return [];
    try {
      return sanitize(JSON.parse(raw));
    } catch {
      return [];
    }
  }, [raw]);

  const persist = useCallback((next: CartItem[]) => writeItems(next), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      add(item) {
        const key = itemKey(item.productId, item.options, item.personalization);
        const existing = items.find((i) => i.key === key);
        persist(
          existing
            ? items.map((i) =>
                i.key === key ? { ...i, quantity: Math.min(99, i.quantity + item.quantity) } : i,
              )
            : [...items, { ...item, key }],
        );
      },
      setQuantity(key, quantity) {
        persist(
          items
            .map((i) => (i.key === key ? { ...i, quantity: Math.min(99, quantity) } : i))
            .filter((i) => i.quantity > 0),
        );
      },
      remove(key) {
        persist(items.filter((i) => i.key !== key));
      },
      clear() {
        persist([]);
      },
    }),
    [items, ready, persist],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
