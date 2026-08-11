import { MapaVivoAuthGate } from "@/components/MapaVivoAuthGate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MapaVivoPage() {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
  let authenticatedProfile = null;

  if (hasSupabaseConfig) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, access_role, position_id")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();

      if (profile?.position_id) {
        const { data: position } = await supabase
          .from("positions")
          .select("external_key")
          .eq("id", profile.position_id)
          .single();

        authenticatedProfile = {
          ...profile,
          position_id: position?.external_key ?? profile.position_id,
        };
      } else {
        authenticatedProfile = profile;
      }
    }
  }

  return <MapaVivoAuthGate serverProfile={authenticatedProfile} />;
}
