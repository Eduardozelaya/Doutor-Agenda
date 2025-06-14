import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe secret key or webhook secret not configured");
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    throw new Error("Stripe signature not found");
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new NextResponse("Webhook signature verification failed", {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription_details?: {
            subscription?: string;
          };
        };

        let userId: string | undefined = undefined;
        let subscriptionId: string | undefined = undefined;
        const customerId = invoice.customer as string;

        if (invoice.subscription_details?.subscription) {
          subscriptionId = invoice.subscription_details.subscription;
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          userId = subscription.metadata?.userId;
        }

        // fallback no caso de não ter vindo no subscription_details
        if (!userId && invoice.lines?.data?.length) {
          const line = invoice.lines.data[0];
          userId = line.metadata?.userId;
        }

        if (!userId) {
          throw new Error("User ID not found");
        }

        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            plan: "essential",
          })
          .where(eq(usersTable.id, userId));

        console.log(`Subscription ativada para usuário ${userId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscriptionDeleted = event.data.object as Stripe.Subscription;
        const userId = subscriptionDeleted.metadata.userId;

        if (!userId) {
          throw new Error("User ID not found in metadata");
        }

        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            plan: null,
          })
          .where(eq(usersTable.id, userId));

        console.log(`Assinatura cancelada para usuário ${userId}`);
        break;
      }

      default: {
        console.log(`Unhandled event type ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler failed", err);
    return new NextResponse("Webhook handler error", { status: 400 });
  }
};
