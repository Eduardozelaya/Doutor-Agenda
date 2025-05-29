"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clinicsTable, usersToClinicTable } from "@/db/schema";
import { auth } from "@/lib/auth";

const createClinic = async (name: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unuthorized");
  }

  const [clinic] = await db.insert(clinicsTable).values({ name }).returning();

  await db.insert(usersToClinicTable).values({
    userId: session.user.id,
    clinicId: clinic.id,
  });

  redirect("/dashboard");
};

export default createClinic;
