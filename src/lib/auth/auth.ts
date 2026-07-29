import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parola", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const adminEmail = process.env.AUTH_ADMIN_EMAIL;
        const adminPassword = process.env.AUTH_ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) return null;
        if (email.toLowerCase() !== adminEmail.toLowerCase()) return null;

        let valid = false;
        if (adminPassword.startsWith("$2")) {
          valid = await compare(password, adminPassword);
        } else {
          valid = password === adminPassword;
        }
        if (!valid) return null;

        return {
          id: "admin-1",
          email: adminEmail,
          name: "Administrator",
          role: "admin",
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  trustHost: true,
});
