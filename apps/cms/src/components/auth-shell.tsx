"use client";

import { useEffect } from "react";

import { Authenticator } from "@aws-amplify/ui-react";
import { signOut } from "aws-amplify/auth";

import { configureAmplify, isAuthEnabled } from "@/lib/auth";

type AuthShellProps = {
  children: (args: { userLabel: string; onSignOut?: () => void }) => JSX.Element;
};

export function AuthShell({ children }: AuthShellProps) {
  const authEnabled = isAuthEnabled();

  useEffect(() => {
    configureAmplify();
  }, []);

  if (!authEnabled) {
    return <>{children({ userLabel: "local-admin" })}</>;
  }

  return (
    <Authenticator hideSignUp={true}>
      {({ user }) =>
        children({
          userLabel: user?.signInDetails?.loginId ?? user?.username ?? "admin",
          onSignOut: () => signOut()
        })
      }
    </Authenticator>
  );
}
