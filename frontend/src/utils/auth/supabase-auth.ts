// @ts-nocheck

import { z } from "zod";
import { getSupabase } from "@/utils/supabase/getSupabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../supabase/types";
// Removed automatic default agent creation

// Constants
export const ROUTES = {
  dashboard: "/dashboard/app/leadconnector", // Update to correct path
  login: "/auth/login",
  error: "/error",
} as const;

const COOKIE_NAMES = ["sb-access-token", "sb-refresh-token"] as const;

// Schemas
const LoginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SignupSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address")
      .min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Types
interface UserProfile {
  user_id_auth: string;
  user_name: string;
  providers: Provider[];
  trained_data_ids?: Record<string, any>;
  data?: Record<string, any>; // Additional profile data
}

interface Provider {
  provider_name: string;
  location_id: string;
  token: string;
  user_type?: string;
  company_id?: string;
  user_id?: string;
}

// Helpers
function getFormData<T extends Record<string, string>>(
  formData: FormData,
  keys: (keyof T & string)[]
): T {
  const result: Partial<T> = {};
  keys.forEach((key) => {
    result[key] = (formData.get(key)?.toString() ?? "") as T[keyof T & string];
  });
  return result as T;
}

function getFirstIssue(error: z.ZodError): AuthResult {
  const issue = error.issues[0];
  return {
    error: issue.message,
    field: issue.path[0]?.toString(),
  };
}

// Auth Functions
export type AuthResult =
  | {
      success: true;
      user: any;
      // access_token: string
    }
  | { error: string; field?: string };

async function createUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string,
  additionalData?: any
): Promise<void> {
  // Parse additional profile data if provided
  let enhancedProfileData: Record<string, any> = {};
  if (additionalData) {
    try {
      enhancedProfileData =
        typeof additionalData === "string"
          ? JSON.parse(additionalData)
          : additionalData;
    } catch (error) {
      console.warn("Failed to parse additional profile data:", error);
    }
  }

  const profile: UserProfile = {
    user_id_auth: userId,
    user_name: enhancedProfileData.displayName || email.split("@")[0],
    providers: [], // Initialize as empty array instead of object
    trained_data_ids: {},
    data: {
      email,
      createdAt: new Date().toISOString(),
      ...enhancedProfileData,
    },
  };

  const { error } = await supabase.from("user_profile").insert(profile);

  if (error) {
    console.error("Profile creation error:", error);
    throw error;
  }

  // User profile created successfully - no automatic agent creation
}

export async function handleLogin(formData: FormData): Promise<AuthResult> {
  const supabase = await getSupabase();
  const rawData = getFormData(formData, ["email", "password"]);
  const result = LoginSchema.safeParse(rawData);

  if (!result.success) return getFirstIssue(result.error);

  try {
    const { data, error } = await supabase.auth.signInWithPassword(result.data);
    //  connectWebSocket(); // pass token if needed
    if (error) throw error;
    if (!data.user) throw new Error("Authentication failed");

    // Verify session exists by checking for access token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Session not established properly");
    }

    return {
      success: true,
      user: data.user,
      // access_token: data.session.access_token,
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return { error: error.message || "Login failed" };
  }
}

export async function handleSignup(formData: FormData): Promise<AuthResult> {
  const supabase = await getSupabase();
  const rawData = getFormData(formData, [
    "email",
    "password",
    "confirmPassword",
  ]);
  const result = SignupSchema.safeParse(rawData);

  if (!result.success) return getFirstIssue(result.error);

  try {
    const { email, password } = result.data;

    // Get additional profile data if provided
    const profileData = formData.get("profileData")?.toString();

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;
    if (!data.user) throw new Error("No user returned from signup");

    // Create user profile with additional data
    await createUserProfile(supabase, data.user.id, email, profileData);

    return {
      success: true,
      user: data.user,
      // access_token: data?.session?.access_token as string,
    };
  } catch (error: any) {
    console.error("Signup error:", error);
    return { error: error.message || "Signup failed" };
  }
}

export type LogoutResult = { success: true } | { error: string };

export async function handleLogout(): Promise<LogoutResult> {
  const supabase = await getSupabase();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Get cookie store and delete session cookies
    const cookieStore = await cookies();
    COOKIE_NAMES.forEach((name) => cookieStore.delete(name));

    return { success: true };
  } catch (error: any) {
    console.error("Logout error:", error);
    return { error: error.message || "Logout failed" };
  }
}

export type ResetPasswordResult =
  | { success: true; message: string }
  | { error: string };

export async function handleResetPassword(
  email: string
): Promise<ResetPasswordResult> {
  const supabase = await getSupabase();

  if (!email) return { error: "Email is required" };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;

    return { success: true, message: "Password reset email sent" };
  } catch (error: any) {
    console.error("Reset password error:", error);
    return { error: error.message || "Failed to reset password" };
  }
}
