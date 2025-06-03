import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.locale("pt-br");
import { doctorsTable } from "@/db/schema";
export const getAvailability = (doctor: typeof doctorsTable.$inferSelect) => {
  const from = dayjs
    .utc()
    .day(doctor.availableFromWeekday)
    .set("hour", Number(doctor.availableFromTime.split(":")[0]))
    .set("minute", Number(doctor.availableFromTime.split(":")[1]))
    .set("second", Number(doctor.availableFromTime.split(":")[2]))
    .local();
  const to = dayjs
    .utc()
    .day(doctor.availableToWeekday)
    .set("hour", Number(doctor.availableToTime.split(":")[0]))
    .set("minute", Number(doctor.availableToTime.split(":")[1]))
    .set("second", Number(doctor.availableToTime.split(":")[2]))
    .local();

  return { from, to };
};
