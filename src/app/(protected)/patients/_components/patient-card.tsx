"use client";

import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { patientsTable } from "@/db/schema";

import { UpsertPatientForm } from "./upsert-patient-form";

interface PatientCardProps {
  patient: typeof patientsTable.$inferSelect;
}

export function PatientCard({ patient }: PatientCardProps) {
  const [isUpsertPatientDialogOpen, setIsUpsertPatientDialogOpen] =
    useState(false);
  const patientInitials = patient.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{patientInitials}</AvatarFallback>
          </Avatar>
        </div>
        <h3 className="text-lg font-semibold">{patient.name}</h3>
        <p className="text-muted-foreground text-sm">{patient.email}</p>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm">
          <span className="font-medium">Telefone:</span> {patient.phoneNumber}
        </p>
        <p className="text-sm">
          <span className="font-medium">Sexo:</span>{" "}
          {patient.sex === "male" ? "Masculino" : "Feminino"}
        </p>
      </CardContent>
      <Separator />
      <CardFooter>
        <Dialog
          open={isUpsertPatientDialogOpen}
          onOpenChange={setIsUpsertPatientDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full">Ver detalhes</Button>
          </DialogTrigger>
          <UpsertPatientForm
            defaultValues={patient}
            isOpen={isUpsertPatientDialogOpen}
            onSuccess={() => setIsUpsertPatientDialogOpen(false)}
          />
        </Dialog>
      </CardFooter>
    </Card>
  );
}
