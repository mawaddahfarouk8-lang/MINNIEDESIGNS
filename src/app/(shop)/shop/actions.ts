"use server";

import { allow, clientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateImage } from "@/lib/validation";

// Stores a customer's card photo before checkout, so the cart only has to keep
// a short path. The bucket is private; only admins can view the files.
export async function uploadCardPhoto(formData: FormData): Promise<{ path?: string; error?: string }> {
  if (!(await allow("cardPhoto", await clientIp()))) return { error: RATE_LIMIT_MESSAGE };

  const file = formData.get("photo");
  const check = await validateImage(file instanceof File ? file : null);
  if (!check.ok) return { error: check.error };

  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${check.ext}`;
  const { error } = await createAdminClient()
    .storage.from("card-photos")
    .upload(path, file as File, { contentType: check.contentType, upsert: false });
  if (error) {
    console.error("card photo upload failed", error.message);
    return { error: "We couldn't upload your photo. Try again." };
  }
  return { path };
}
