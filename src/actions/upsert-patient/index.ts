"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = actionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.clinic?.id) {
      throw new Error("Você precisa estar vinculado a uma clínica.");
    }

    const { id, ...rest } = parsedInput;

    if (id) {
      const patient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, id),
      });

      if (!patient) {
        throw new Error("Paciente não encontrado");
      }

      if (patient.clinicId !== session.user.clinic.id) {
        throw new Error("Paciente não encontrado");
      }

      await db
        .update(patientsTable)
        .set({
          ...rest,
          updatedAt: new Date(),
        })
        .where(eq(patientsTable.id, id));

      revalidatePath("/patients");

      return { message: "Paciente atualizado com sucesso!" };
    }

    await db.insert(patientsTable).values({
      ...rest,
      clinicId: session.user.clinic.id,
    });

    revalidatePath("/patients");

    return { message: "Paciente criado com sucesso!" };
  });
