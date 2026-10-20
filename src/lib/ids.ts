import "server-only";

// Unambiguous characters (no 0/O, 1/I/L) so customers can read numbers aloud.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function randomCode(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const newOrderNumber = () => `MD-${randomCode(8)}`;
export const newRequestReference = () => `CR-${randomCode(6)}`;
