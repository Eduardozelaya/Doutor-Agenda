"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { getAvailableTimes } from "@/actions/get-available-times";
import { upsertAppointment } from "@/actions/upsert-appointment";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  patientId: z.string().min(1, {
    message: "Paciente é obrigatório.",
  }),
  doctorId: z.string().min(1, {
    message: "Médico é obrigatório.",
  }),
  appointmentPrice: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
  date: z.date({
    required_error: "Data é obrigatória.",
  }),
  time: z.string().min(1, {
    message: "Horário é obrigatório.",
  }),
  clinicId: z.string(),
});

interface TimeSlot {
  value: string;
  available: boolean;
  label: string;
}

interface AvailableTimesResponse {
  data: TimeSlot[];
}

interface UpsertAppointmentFormProps {
  doctors: (typeof doctorsTable.$inferSelect)[];
  patients: (typeof patientsTable.$inferSelect)[];
  appointment?: typeof appointmentsTable.$inferSelect & {
    doctor: typeof doctorsTable.$inferSelect;
    patient: typeof patientsTable.$inferSelect;
  };
  clinicId: string;
  onSuccess?: () => void;
}

export function UpsertAppointmentForm({
  doctors,
  patients,
  appointment,
  clinicId,
  onSuccess,
}: UpsertAppointmentFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: appointment?.patientId ?? "",
      doctorId: appointment?.doctorId ?? "",
      appointmentPrice: appointment?.doctor?.appointmentPriceInCents
        ? appointment.doctor.appointmentPriceInCents / 100
        : 0,
      date: appointment?.date ? dayjs(appointment.date).toDate() : undefined,
      time: appointment?.date ? dayjs(appointment.date).format("HH:mm:ss") : "",
      clinicId,
    },
  });

  // Função para limpar o formulário
  const resetForm = () => {
    form.reset({
      patientId: "",
      doctorId: "",
      appointmentPrice: 0,
      date: undefined,
      time: "",
      clinicId,
    });
  };

  const { data: availableTimes = [] } = useQuery<TimeSlot[], Error, TimeSlot[]>(
    {
      queryKey: ["available-times", form.watch("doctorId"), form.watch("date")],
      queryFn: async () => {
        if (!form.watch("date") || !form.watch("doctorId")) return [];

        const result = await getAvailableTimes({
          date: dayjs(form.watch("date")).format("YYYY-MM-DD"),
          doctorId: form.watch("doctorId"),
        });

        return (result as AvailableTimesResponse)?.data ?? [];
      },
      enabled: !!form.watch("date") && !!form.watch("doctorId"),
    },
  );

  // Reseta o formulário quando abrir novamente ou quando os dados mudarem
  useEffect(() => {
    if (!appointment) {
      resetForm();
    } else {
      form.reset({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentPrice: appointment.doctor.appointmentPriceInCents / 100,
        date: dayjs(appointment.date).toDate(),
        time: dayjs(appointment.date).format("HH:mm:ss"),
        clinicId,
      });
    }
  }, [appointment, clinicId, form]);

  // Atualiza o preço quando selecionar o médico
  useEffect(() => {
    const doctorId = form.watch("doctorId");
    if (doctorId) {
      const selectedDoctor = doctors.find((doctor) => doctor.id === doctorId);
      if (selectedDoctor) {
        form.setValue(
          "appointmentPrice",
          selectedDoctor.appointmentPriceInCents / 100,
        );
      }
    }
  }, [doctors, form]);

  const { execute: executeUpsert, status } = useAction(upsertAppointment, {
    onSuccess: () => {
      toast.success(
        appointment
          ? "Agendamento atualizado com sucesso"
          : "Agendamento criado com sucesso",
      );
      resetForm();
      onSuccess?.();
    },
    onError: () => {
      toast.error(
        appointment
          ? "Erro ao atualizar agendamento"
          : "Erro ao criar agendamento",
      );
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Verifica se o horário está disponível
    const selectedTime = availableTimes.find(
      (time: TimeSlot) => time.value === values.time,
    );
    if (!selectedTime?.available) {
      toast.error("Este horário não está mais disponível");
      return;
    }

    // Cria a data base a partir do dia selecionado
    const baseDate = dayjs(values.date);

    // Extrai as horas e minutos do horário selecionado
    const [hours, minutes] = values.time.split(":").map(Number);

    // Combina a data com o horário selecionado
    const finalDate = baseDate
      .set("hour", hours)
      .set("minute", minutes)
      .set("second", 0)
      .toDate();

    executeUpsert({
      ...values,
      date: finalDate,
      id: appointment?.id,
    });
  };

  const isDateAvailable = (date: Date) => {
    if (!form.watch("doctorId")) return false;
    const selectedDoctor = doctors.find(
      (doctor) => doctor.id === form.watch("doctorId"),
    );
    if (!selectedDoctor) return false;

    // Ajusta para o dia da semana no formato do banco (0 = Domingo, 6 = Sábado)
    const dayOfWeek = date.getDay();

    // Verifica se o dia está dentro do intervalo de dias disponíveis do médico
    if (
      selectedDoctor.availableFromWeekday <= selectedDoctor.availableToWeekday
    ) {
      // Caso normal: ex: segunda a sexta (1 a 5) ou domingo a sábado (0 a 6)
      return (
        dayOfWeek >= selectedDoctor.availableFromWeekday &&
        dayOfWeek <= selectedDoctor.availableToWeekday
      );
    } else {
      // Caso que cruza o domingo: ex: quinta a segunda (4 a 1)
      return (
        dayOfWeek >= selectedDoctor.availableFromWeekday ||
        dayOfWeek <= selectedDoctor.availableToWeekday
      );
    }
  };

  const isDateTimeEnabled = form.watch("patientId") && form.watch("doctorId");

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {appointment ? "Editar agendamento" : "Novo agendamento"}
        </DialogTitle>
        <DialogDescription>
          {appointment
            ? "Edite as informações desse agendamento."
            : "Preencha os dados para criar um novo agendamento."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Médico</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um médico" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.speciality} - R${" "}
                        {(doctor.appointmentPriceInCents / 100).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="appointmentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da consulta</FormLabel>
                <NumericFormat
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value.floatValue);
                  }}
                  decimalScale={2}
                  fixedDecimalScale
                  decimalSeparator=","
                  thousandSeparator="."
                  prefix="R$ "
                  allowNegative={false}
                  disabled={!form.watch("doctorId")}
                  customInput={Input}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={!isDateTimeEnabled}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || !isDateAvailable(date)
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isDateTimeEnabled || !form.watch("date")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimes.map((time: TimeSlot) => {
                      // Se estiver editando e for o mesmo horário do agendamento atual,
                      // não deve aparecer como indisponível
                      const isCurrentAppointmentTime = appointment?.date
                        ? dayjs(appointment.date).format("HH:mm:ss") ===
                          time.value
                        : false;

                      const showAsUnavailable =
                        !time.available && !isCurrentAppointmentTime;

                      return (
                        <SelectItem
                          key={time.value}
                          value={time.value}
                          disabled={showAsUnavailable}
                          className={
                            showAsUnavailable ? "text-muted-foreground" : ""
                          }
                        >
                          {time.label}
                          {showAsUnavailable && (
                            <span className="text-destructive ml-2">
                              ({appointment ? "Reservado" : "Indisponível"})
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={!isDateTimeEnabled || status === "executing"}
            >
              {status === "executing"
                ? "Salvando..."
                : appointment
                  ? "Salvar"
                  : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
