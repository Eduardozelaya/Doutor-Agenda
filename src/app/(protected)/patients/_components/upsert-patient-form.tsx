"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";

import { deletePatient } from "@/actions/delete-patient";
import { upsertPatient } from "@/actions/upsert-patient";
import {
  UpsertPatientSchema,
  upsertPatientSchema,
} from "@/actions/upsert-patient/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UpsertPatientFormProps {
  isOpen?: boolean;
  defaultValues?: Partial<UpsertPatientSchema>;
  onSuccess?: () => void;
}

export function UpsertPatientForm({
  isOpen,
  defaultValues,
  onSuccess,
}: UpsertPatientFormProps) {
  const form = useForm<UpsertPatientSchema>({
    shouldUnregister: true,
    resolver: zodResolver(upsertPatientSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phoneNumber: defaultValues?.phoneNumber ?? "",
      sex: defaultValues?.sex ?? "male",
    },
  });

  useEffect(() => {
    if (isOpen && defaultValues) {
      form.reset(defaultValues);
    }
  }, [isOpen, form, defaultValues]);

  const { execute: executeUpsert, status: upsertStatus } = useAction(
    upsertPatient,
    {
      onSuccess: () => {
        toast.success(
          defaultValues?.id
            ? "Paciente atualizado com sucesso!"
            : "Paciente criado com sucesso!",
        );
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        toast.error(
          defaultValues?.id
            ? "Erro ao atualizar paciente"
            : "Erro ao criar paciente",
        );
      },
    },
  );

  const { execute: executeDelete } = useAction(deletePatient, {
    onSuccess: () => {
      toast.success("Paciente deletado com sucesso!");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao deletar paciente");
    },
  });

  function onSubmit(data: UpsertPatientSchema) {
    executeUpsert(data);
  }

  function handleDeletePatient() {
    if (!defaultValues?.id) return;
    executeDelete({ id: defaultValues.id });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {defaultValues?.id ? "Editar paciente" : "Adicionar paciente"}
        </DialogTitle>
        <DialogDescription>
          {defaultValues?.id
            ? "Edite as informações desse paciente."
            : "Adicione um novo paciente."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Paciente</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome do paciente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Digite o email do paciente"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Número de Telefone</FormLabel>
                <FormControl>
                  <PatternFormat
                    format="(##) #####-####"
                    customInput={Input}
                    onValueChange={(values) => {
                      onChange(values.value);
                    }}
                    placeholder="Digite o telefone do paciente"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            {defaultValues?.id && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Deletar Paciente</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Tem certeza que deseja deletar o paciente?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação é irreversível.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletePatient}>
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" disabled={upsertStatus === "executing"}>
              {upsertStatus === "executing"
                ? "Salvando..."
                : defaultValues?.id
                  ? "Salvar"
                  : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
