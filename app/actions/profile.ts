"use server";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Profile Server Actions
// ─────────────────────────────────────────────
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const company_name = formData.get("company_name") as string;
  const avatar_url = formData.get("avatar_url") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      phone: phone || null,
      company_name: company_name || null,
      avatar_url: avatar_url || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/(dashboard)", "layout"); // refreshes Navbar profile data
  return { success: true };
}