"use client";

import React from "react";

interface Session {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  expires?: string;
}

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  // AuthProvider wraps children and provides session context.
  // In a full implementation, this would use NextAuth's SessionProvider.
  // For now, it passes session data through context or props.

  // The session is provided server-side via the (main) layout.
  // Client components can access it via useSession() from next-auth/react
  // when the SessionProvider is set up here.

  return <>{children}</>;
}
