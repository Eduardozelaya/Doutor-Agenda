"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import { AppointmentTableActions } from "./table-actions";

type Appointment = typeof appointmentsTable.$inferSelect & {
  doctor: typeof doctorsTable.$inferSelect;
  patient: typeof patientsTable.$inferSelect;
};

export const appointmentsTableColumns: ColumnDef<Appointment>[] = [
  {
    id: "patient",
    header: "Paciente",
    accessorFn: (row) => row.patient.name,
  },
  {
    id: "doctor",
    header: "Médico",
    accessorFn: (row) => row.doctor.name,
  },
  {
    id: "date",
    header: "Data",
    accessorFn: (row) => format(row.date, "PPP", { locale: ptBR }),
  },
  {
    id: "time",
    header: "Horário",
    accessorFn: (row) => format(row.date, "HH:mm"),
  },
  {
    id: "appointmentPrice",
    header: "Valor",
    accessorFn: (row) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(row.doctor.appointmentPriceInCents / 100),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const appointment = row.original;

      return <AppointmentTableActions appointment={appointment} />;
    },
  },
];
