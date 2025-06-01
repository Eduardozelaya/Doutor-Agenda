import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { usersToClinicTable } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
    usePlural: true,
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const clinics = await db.query.usersToClinicTable.findMany({
        where: eq(usersToClinicTable.userId, user.id),
        with: {
          clinic: true,
        },
      });

      console.log("Usuário ID:", user.id);
      console.log("Clinics encontradas:", clinics);

      const clinic = clinics?.[0];

      return {
        user: {
          ...user,
          clinic: clinic
            ? {
                id: clinic?.clinicId,
                name: clinic?.clinic?.name,
              }
            : null,
        },
        session,
      };
    }),
  ],
  user: {
    modelName: "usersTable",
  },
  session: {
    modelName: "sessionsTable",
  },
  account: {
    modelName: "accountsTable",
  },
  verificationToken: {
    modelName: "verifications",
  },
  emailAndPassword: {
    enabled: true,
  },
});
