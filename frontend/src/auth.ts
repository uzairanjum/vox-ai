import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { Account, User } from "next-auth";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      try {
        const parsedUrl = new URL(url, baseUrl);
        const redirectedFrom = parsedUrl.searchParams.get("redirectedFrom");

        if (redirectedFrom) {
          return `${baseUrl}${redirectedFrom}`;
        }

        if (url.startsWith("/")) return `${baseUrl}${url}`;
        return `${baseUrl}/dashboard/app/leadconnector`;
      } catch (e) {
        console.error("Redirect callback error:", e);
        return `${baseUrl}/dashboard/app/leadconnector`;
      }
    },
    async jwt({
      token,
      account,
      user,
    }: {
      token: JWT;
      account?: Account | null;
      user?: User;
    }) {
      if (account) {
        (token as any).accessToken = account.access_token;
        (token as any).provider = account.provider;
      }
      if (user) {
        (token as any).user = user;
      }
      return token;
    },
    // async session({ session, token }: { session: Session; token: JWT }) {
    //   (session as any).accessToken = (token as any).accessToken;
    //   (session as any).provider = (token as any).provider;
    //   (session as any).user = (token as any).user;
    //   return session;
    // },
  },
};

export const { auth, signIn, signOut } = NextAuth(authConfig);
