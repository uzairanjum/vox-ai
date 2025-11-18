import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { Account, User } from "next-auth";

import { authConfig } from "@/auth"; // 👈 import config from central file

const { handlers } = NextAuth(authConfig);

// ✅ Only export HTTP handlers here
export const { GET, POST } = handlers;
