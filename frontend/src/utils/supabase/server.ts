import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./types";

const getSupabaseEnvVars = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Check SUPABASE_URL and SUPABASE_ANON_KEY."
    );
  }

  return { url, key };
};

export async function createClient() {
  const { url, key } = getSupabaseEnvVars();

  return createServerClient<Database>(url, key, {
    cookies: {
      async get(name: string) {
        try {
          if (typeof window !== "undefined") return;
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        } catch (error) {
          console.warn("Cookie get operation failed:", error);
          return undefined;
        }
      },
      async set(name: string, value: string, options?: CookieOptions) {
        try {
          if (typeof window !== "undefined") return; // Only set cookies on server
          const cookieStore = await cookies();
          cookieStore.set(name, value, {
            ...options,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            httpOnly: true,
          });
        } catch (error) {
          // Log but don't throw - middleware may be handling cookies
          console.warn("Cookie set operation failed:", error);
        }
      },
      async remove(name: string) {
        try {
          if (typeof window !== "undefined") return; // Only remove cookies on server
          const cookieStore = await cookies();
          cookieStore.delete(name);
        } catch (error) {
          // Log but don't throw - middleware may be handling cookies
          console.warn("Cookie remove operation failed:", error);
        }
      },
    },
  });
}

// Helper to get a typed Supabase client for server-side operations
export const getServerSupabase = createClient;
