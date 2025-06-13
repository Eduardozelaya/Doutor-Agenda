"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertAppointmentSchema } from "./schema";

export const upsertAppointment = actionClient
  .schema(upsertAppointmentSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.clinic?.id) {
      throw new Error("Você precisa estar vinculado a uma clínica.");
    }

    const clinicId = session.user.clinic.id;
    const { id, appointmentPrice, ...rest } = parsedInput;

    // Converte o preço de reais para centavos
    const appointmentPriceInCents = Math.round(appointmentPrice * 100);

    if (id) {
      const appointment = await db.query.appointmentsTable.findFirst({
        where: eq(appointmentsTable.id, id),
      });

      if (!appointment || appointment.clinicId !== clinicId) {
        throw new Error("Agendamento não encontrado");
      }

      await db
        .update(appointmentsTable)
        .set({
          ...rest,
          appointmentPriceInCents,
          clinicId,
        })
        .where(eq(appointmentsTable.id, id));

      revalidatePath("/appointments");
      return { success: true, message: "Agendamento atualizado com sucesso!" };
    }

    await db.insert(appointmentsTable).values({
      ...rest,
      appointmentPriceInCents,
      clinicId,
    });

    revalidatePath("/appointments");
    return { success: true, message: "Agendamento criado com sucesso!" };
  });
