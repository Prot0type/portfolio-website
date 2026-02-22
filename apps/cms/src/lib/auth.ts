"use client";

import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";

let configured = false;

export function isAuthEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_ENABLE_AUTH ?? "true").toLowerCase() !== "false";
}

export function configureAmplify() {
  if (configured || !isAuthEnabled()) {
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        // Use direct NEXT_PUBLIC env access so Next.js replaces values at build time in the client bundle.
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID ?? "",
        loginWith: {
          email: true
        }
      }
    }
  });
  configured = true;
}

export async function getAuthToken(): Promise<string | undefined> {
  if (!isAuthEnabled()) {
    return undefined;
  }
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString();
}
