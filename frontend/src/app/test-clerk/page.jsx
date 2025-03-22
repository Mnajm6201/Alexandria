"use client";

import { useState } from "react";
import { useAuth, SignIn, SignInButton } from "@clerk/nextjs";
import axios from "axios";

export default function TestClerkPage() {
  const { isSignedIn, getToken } = useAuth();
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function testBackend() {
    try {
      setLoading(true);
      setError(null);

      // Get the session token from Clerk
      const token = await getToken();

      console.log("Got Clerk token:", token);

      // Send it to your Django backend
      const response = await axios.post(
        "http://localhost:8000/api/auth/clerk/verify/",
        {
          session_token: token,
        }
      );

      setResponse(response.data);
      console.log("Django response:", response.data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Clerk Integration</h1>

      {!isSignedIn ? (
        <div className="bg-yellow-100 p-4 rounded-md mb-6">
          <p className="mb-4">
            You are not signed in. Please sign in to test the integration.
          </p>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              Sign In with Clerk
            </button>
          </SignInButton>
        </div>
      ) : (
        <div>
          <div className="bg-green-100 p-4 rounded-md mb-6">
            <p>You are signed in with Clerk! ✅</p>
          </div>
          
          <button
            onClick={testBackend}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Testing..." : "Test Backend Integration"}
          </button>

          {response && (
            <div className="mt-8 border p-4 rounded-md bg-gray-50">
              <h2 className="text-xl font-semibold mb-2">Backend Response:</h2>
              <pre className="bg-black text-green-400 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="mt-8 border p-4 rounded-md bg-red-50">
              <h2 className="text-xl font-semibold mb-2">Error:</h2>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
