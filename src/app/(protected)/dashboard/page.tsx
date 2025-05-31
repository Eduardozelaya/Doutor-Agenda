import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { usersToClinicTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import SignOutButton from "./_components/sign-out-button"; // ✅ CORRETO

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Corrigido: redirecionar para login se NÃO houver usuário logado
  if (!session?.user) {
    redirect("/authentication");
  }

  const clinic = await db.query.usersToClinicTable.findMany({
    where: eq(usersToClinicTable.userId, session.user.id),
  });

  if (clinic.length === 0) {
    redirect("/clinic-form");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <h1>{session?.user?.name}</h1>
      <h1>{session?.user?.email}</h1>
      <Image
        src={session?.user?.image ?? "/default-user.png"}
        alt="User"
        width={100}
        height={100}
      />
      <SignOutButton />
    </div>
  );
};

export default DashboardPage;
