import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * Providers are opt-in by environment so a deployment can run with only the
 * credentials it actually has configured.
 */
function providers(): NextAuthConfig["providers"] {
  const configured: NextAuthConfig["providers"] = [];
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    configured.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      })
    );
  }
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    configured.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      })
    );
  }
  return configured;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: providers(),
  // JWT sessions keep auth state out of the battery database, so the only
  // rows keyed by a user are the ones CertiCell writes itself.
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, account, profile }) {
      // Namespace the subject by provider so two providers issuing the same
      // opaque id can never collide into one CertiCell workspace.
      if (account) {
        token.owner = `${account.provider}:${account.providerAccountId}`;
      }
      if (profile?.name && !token.name) token.name = profile.name;
      return token;
    },
    session({ session, token }) {
      if (token.owner) {
        (session.user as { owner?: string }).owner = token.owner as string;
      }
      return session;
    },
  },
});
