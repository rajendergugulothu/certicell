import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type AppUser = {
  /** Stable per-provider identity used as the `owner` column on every record. */
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const SIGN_IN_PATH = "/api/auth/signin";
const SIGN_OUT_PATH = "/api/auth/signout";

export async function getUser(): Promise<AppUser | null> {
  const session = await auth();
  const user = session?.user as
    | { owner?: string; email?: string | null; name?: string | null }
    | undefined;
  if (!user?.owner || !user.email) return null;

  const fullName = user.name ?? null;
  return {
    userId: user.owner,
    displayName: fullName ?? user.email,
    email: user.email,
    fullName,
  };
}

export async function requireUser(returnTo: string): Promise<AppUser> {
  const user = await getUser();
  if (user) return user;

  redirect(signInPath(returnTo));
}

export function signInPath(returnTo: string): string {
  return `${SIGN_IN_PATH}?callbackUrl=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function signOutPath(returnTo = "/"): string {
  return `${SIGN_OUT_PATH}?callbackUrl=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

/** Only same-origin relative paths may be used as a post-auth destination. */
function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return pathname.startsWith("/api/auth");
}
