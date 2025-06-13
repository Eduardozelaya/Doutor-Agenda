import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { AddAppointmentButton } from "./_components/add-appointment-button";
import { appointmentsTableColumns } from "./_components/table-columns";

export default async function AppointmentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session?.user.clinic) {
    redirect("/clinic-form");
  }
  if (!session.user.plan) {
    redirect("/new-subscription");
  }

  const [doctors, patients, appointments] = await Promise.all([
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, session.user.clinic.id),
      orderBy: [desc(doctorsTable.name)],
    }),
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, session.user.clinic.id),
      orderBy: [desc(patientsTable.name)],
    }),
    db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.clinicId, session.user.clinic.id),
      with: {
        doctor: true,
        patient: true,
      },
      orderBy: [desc(appointmentsTable.date)],
    }),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
          <PageDescription>
            Gerencie os agendamentos da clínica.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddAppointmentButton
            doctors={doctors}
            patients={patients}
            clinicId={session.user.clinic.id}
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <DataTable columns={appointmentsTableColumns} data={appointments} />
      </PageContent>
    </PageContainer>
  );
}
