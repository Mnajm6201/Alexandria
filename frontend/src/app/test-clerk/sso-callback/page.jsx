// src/app/test-clerk/sso-callback/page.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect back to the test page after the callback is handled by Clerk
    router.push("/test-clerk");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Processing authentication...</p>
    </div>
  );
}
