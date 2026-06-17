export type UserProfile = {
  role: string | null;
  verification_status: string | null;
};

export function isAdmin(profile: UserProfile | null | undefined) {
  return profile?.role === "admin";
}

export function isVerifiedDealer(profile: UserProfile | null | undefined) {
  return (
    profile?.role === "dealer" && profile.verification_status === "verified"
  );
}

export function canAccessDashboard(profile: UserProfile | null | undefined) {
  return isAdmin(profile) || isVerifiedDealer(profile);
}

export function getPostLoginPath(
  profile: UserProfile | null | undefined,
  next?: string,
) {
  const safeNext = next && next.startsWith("/") ? next : undefined;

  if (isAdmin(profile)) {
    return safeNext ?? "/dashboard";
  }

  if (profile?.role === "dealer") {
    if (profile.verification_status === "verified") {
      return safeNext ?? "/dashboard";
    }
    return "/dealer-application";
  }

  if (safeNext && !safeNext.startsWith("/dashboard")) {
    return safeNext;
  }

  return "/profile";
}
