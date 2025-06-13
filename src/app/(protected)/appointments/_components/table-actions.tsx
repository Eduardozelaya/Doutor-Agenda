"use client";

import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deleteAppointment } from "@/actions/delete-appointment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import { UpsertAppointmentForm } from "./upsert-appointment-form";

interface AppointmentTableActionsProps {
  appointment: typeof appointmentsTable.$inferSelect & {
    doctor: typeof doctorsTable.$inferSelect;
    patient: typeof patientsTable.$inferSelect;
  };
}

export function AppointmentTableActions({
  appointment,
}: AppointmentTableActionsProps) {
  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);

  const { execute: executeDelete } = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success("Agendamento excluído com sucesso");
      setDeleteDialogIsOpen(false);
    },
    onError: () => {
      toast.error("Erro ao excluir agendamento");
    },
  });

  const handleDelete = () => {
    executeDelete({ id: appointment.id });
  };

  return (
    <>
      <Dialog open={upsertDialogIsOpen} onOpenChange={setUpsertDialogIsOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setUpsertDialogIsOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteDialogIsOpen(true)}>
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UpsertAppointmentForm
          appointment={appointment}
          doctors={[appointment.doctor]}
          patients={[appointment.patient]}
          clinicId={appointment.clinicId}
          onSuccess={() => setUpsertDialogIsOpen(false)}
        />
      </Dialog>

      <AlertDialog
        open={deleteDialogIsOpen}
        onOpenChange={setDeleteDialogIsOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              agendamento do paciente {appointment.patient.name} com o médico{" "}
              {appointment.doctor.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
