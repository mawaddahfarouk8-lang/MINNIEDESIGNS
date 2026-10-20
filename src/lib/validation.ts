import { z } from "zod";

export const PHONE_RE = /^01[0125][0-9]{8}$/;

// Accepts spaces, dashes and +20 / 0020 prefixes, returns 01XXXXXXXXX.
export function normalizePhone(input: string) {
  const digits = input.replace(/[\s-]/g, "").replace(/^(\+20|0020)/, "0");
  return digits;
}

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => PHONE_RE.test(v), {
    message: "Enter an Egyptian mobile number, like 01012345678.",
  });

export const optionalEmail = z
  .string()
  .trim()
  .max(190)
  .refine((v) => v === "" || z.email().safeParse(v).success, {
    message: "Enter a valid email address, or leave it empty.",
  });

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

// Checks the declared type, the size, and the file's magic bytes.
export async function validateImage(file: File | null) {
  if (!file || file.size === 0) return { ok: false as const, error: "Choose an image." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false as const, error: "The image must be 4 MB or smaller." };
  }
  if (!UPLOAD_TYPES.includes(file.type as (typeof UPLOAD_TYPES)[number])) {
    return { ok: false as const, error: "Upload a JPG, PNG or WEBP image." };
  }

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isWebp =
    String.fromCharCode(...head.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...head.slice(8, 12)) === "WEBP";

  const ext = isJpeg ? "jpg" : isPng ? "png" : isWebp ? "webp" : null;
  if (!ext) {
    return { ok: false as const, error: "That file isn't a valid image." };
  }
  const contentType = isJpeg ? "image/jpeg" : isPng ? "image/png" : "image/webp";
  return { ok: true as const, ext, contentType };
}

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
