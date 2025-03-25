import { ClerkProvider } from "@clerk/nextjs";
import React, { ReactNode } from "react";
import { AuthSynchronizer } from "./AuthSynchronizer";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""}
    >
      <AuthSynchronizer />
      {children}
    </ClerkProvider>
  );
}
