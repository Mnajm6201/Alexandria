"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function ResetPasswordPage() {
  const { openSignIn } = useClerk();
  const router = useRouter();

  useEffect(() => {
    openSignIn();
    setTimeout(() => {
      router.push("/auth/sign-in");
    }, 500);
  }, [openSignIn, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg">Redirecting to password reset...</p>
      </div>
    </div>
  );
}
