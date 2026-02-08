"use client";

import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";

let configured = false;

function env(key: string): string {
  return process.env[key] ?? "";
}

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
        userPoolId: env("NEXT_PUBLIC_COGNITO_USER_POOL_ID"),
        userPoolClientId: env("NEXT_PUBLIC_COGNITO_APP_CLIENT_ID"),
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

