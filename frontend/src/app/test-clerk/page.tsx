"use client";

import { useState, useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import axios from "axios";
import Cookies from "js-cookie";

interface BackendResponse {
  refresh: string;
  access: string;
  user_id: number;
  email: string;
  is_new_user: boolean;
}

export default function TestClerkPage() {
  const { isSignedIn, getToken } = useAuth();
  const [response, setResponse] = useState<BackendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setIsLoading] = useState<boolean>(false);

  // Automatically call the backend when user is signed in
  useEffect(() => {
    if (isSignedIn) {
      verifyBackend();
    }
  }, [isSignedIn]); // The side effect will depend on if the user is signed in or not, so when the user is registered it will call our backend

  async function verifyBackend() {
    try {
      setIsLoading(true);
      setError(null);

      // get the access token
      const token = await getToken();

      console.log("access token from clerk:", token);

      // Send the token to our backend to process the user information to our database
      const response = await axios.post(
        "http://localhost:8000/api/auth/clerk/verify/",
        { session_token: token }
      );

      // Check if the response is successful

      // Parse the JSON response
      const responseData = await response.data;

      // Setting the response data
      setResponse(responseData);
      console.log("Django Response: ", responseData);

      /* 
          Cookies:
            Cookies.set() parameters:
              1. The name of the cookie (access_token)
              2. The value to store (resposne.data.acess)
              3. Option objecgts with settings:
                - expires: 1/24 : Defines when the cookie will expire, in this case it will expire 1/24th day aka 1 hour 
                it supports depending the number of days and also fractional values for sub days too
                - secure: process.env.NODE_ENV == 'production': when it's true it will only be sent over HTTPS connections, this will only say true, since during development we're ususally in HTTP instead of HTTPS
                so if it's set to TRUE would prevent the cookie from working locally
                - sameSite: 'strict' :  controls when cookies are sent with cross-site requests,
                options given: 
                'strict' : the cookie is only sent to the site where it originated
                'lax': the cookie is sent when the user navigates to the site that set the cookie
                'none': the cookie is setn on cross siet requests (requires : secure == True)
              4. Benefit of using this prevents the CSRF attacks
        */
      Cookies.set("access_token", responseData, {
        expires: 1 / 24, // 1 hour in days,
        secure: process.env.NODE_ENV == "production",
        sameSite: "strict",
      });

      Cookies.set("refresh_token", responseData, {
        expires: 1, // 1 day
        secure: process.env.NODE_ENV == "production",
        sameSite: "strict",
      });
    } catch (error) {
      console.error("Error: ", error);
      setError(error instanceof Error ? error.message : "An error occured");
    } finally {
      setIsLoading(false);
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
            {loading && <p>Verifying with backend...</p>}
          </div>

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
              <button
                onClick={verifyBackend}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
