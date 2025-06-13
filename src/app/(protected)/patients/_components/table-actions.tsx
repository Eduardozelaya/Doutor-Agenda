import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deletePatient } from "@/actions/delete-patient";
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
import { patientsTable } from "@/db/schema";

import { UpsertPatientForm } from "./upsert-patient-form";

type Patient = typeof patientsTable.$inferSelect;

interface PatientsTableActionsProps {
  patient: Patient;
}

const PatientsTableActions = ({ patient }: PatientsTableActionsProps) => {
  const [upsertPatientDialogIsOpen, setUpsertPatientDialogIsOpen] =
    useState(false);
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);

  const { execute: executeDelete } = useAction(deletePatient, {
    onSuccess: () => {
      toast("Paciente excluído com sucesso");
      setDeleteDialogIsOpen(false);
    },
    onError: (error) => {
      toast("Erro ao excluir paciente", {
        description: error.error?.serverError ?? "Erro desconhecido",
      });
    },
  });

  return (
    <>
      <Dialog
        open={upsertPatientDialogIsOpen}
        onOpenChange={setUpsertPatientDialogIsOpen}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{patient.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setUpsertPatientDialogIsOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteDialogIsOpen(true)}>
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UpsertPatientForm
          isOpen={upsertPatientDialogIsOpen}
          defaultValues={patient}
          onSuccess={() => setUpsertPatientDialogIsOpen(false)}
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
              paciente {patient.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeDelete({ id: patient.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PatientsTableActions;
