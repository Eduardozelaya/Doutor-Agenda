"use client";

import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import SignOutButton from "./components/sign-out-button";

const DashboardPage = () => {
  const session = authClient.useSession();

  return (
    <div>
      <h1>Dashboard</h1>
      {!session.data ? (
        redirect("/authentication")
      ) : (
        <>
          <h1>{session?.data?.user?.name}</h1>
          <h1>{session?.data?.user?.email}</h1>
          <SignOutButton />
        </>
      )}
    </div>
  );
};

export default DashboardPage;
