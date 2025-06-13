"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { doctorsTable, patientsTable } from "@/db/schema";

import { UpsertAppointmentForm } from "./upsert-appointment-form";

interface AddAppointmentButtonProps {
  doctors: (typeof doctorsTable.$inferSelect)[];
  patients: (typeof patientsTable.$inferSelect)[];
  clinicId: string;
}

export function AddAppointmentButton({
  doctors,
  patients,
  clinicId,
}: AddAppointmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo agendamento
        </Button>
      </DialogTrigger>
      <UpsertAppointmentForm
        doctors={doctors}
        patients={patients}
        clinicId={clinicId}
        onSuccess={() => setIsOpen(false)}
      />
    </Dialog>
  );
}
