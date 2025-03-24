import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
