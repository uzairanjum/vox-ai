"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  handleLogin as authLogin,
  handleSignup as authSignup,
  handleLogout as authLogout,
  handleResetPassword as authResetPassword,
  ROUTES,
} from "@/utils/auth/supabase-auth";

interface NextRedirectError extends Error {
  message: string;
  digest?: string;
}

function isNextRedirectError(error: unknown): error is NextRedirectError {
  return (
    error instanceof Error &&
    (error.message === "NEXT_REDIRECT" ||
      error.message.includes("NEXT_REDIRECT"))
  );
}

export async function login(formData: FormData) {
  try {
    const result = await authLogin(formData);

    if ('success' in result && result.success) {
      revalidatePath("/", "layout")
      redirect(ROUTES.dashboard)
    }
    return result;
  } catch (e) {
    if (isNextRedirectError(e)) {
      // This is expected behavior for redirects
      throw e;
    }
    console.error("Login error:", e);
    return { error: "An unexpected error occurred" };
  }
}

export async function signup(formData: FormData) {
  console.log("formData keys in signup:", [...formData.keys()]);
  try {
    const result = await authSignup(formData);

    if ("success" in result && result.success) {
      revalidatePath("/profile");
      redirect(ROUTES.dashboard);
    }

    return result;
  } catch (e) {
    if (isNextRedirectError(e)) {
      // This is expected behavior for redirects
      throw e;
    }
    console.error("Signup error:", e);
    return { error: "An unexpected error occurred" };
  }
}

export async function logout() {
  try {
    const result = await authLogout();

    if ("success" in result && result.success) {
      revalidatePath("/", "layout");
      redirect(ROUTES.login);
    }

    return result;
  } catch (e) {
    if (isNextRedirectError(e)) {
      // This is expected behavior for redirects
      throw e;
    }
    console.error("Logout error:", e);
    return { error: "An unexpected error occurred" };
  }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email")?.toString();
  if (!email) return { error: "Email is required" };

  try {
    return await authResetPassword(email);
  } catch (e) {
    console.error("Reset password error:", e);
    return { error: "An unexpected error occurred" };
  }
}

