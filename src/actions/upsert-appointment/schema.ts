import { z } from "zod";

export const upsertAppointmentSchema = z.object({
  id: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  date: z.date(),
  appointmentPrice: z.number().min(1),
  time: z.string().min(1),
  clinicId: z.string().uuid(),
});

export type UpsertAppointmentSchema = z.infer<typeof upsertAppointmentSchema>;
