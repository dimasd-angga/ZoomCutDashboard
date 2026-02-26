"use client";
import * as React from "react";
import { useAppContext } from "@/components/AppContext";
import { SubscriptionDetails } from "./SubscriptionDetails";
import { PaymentHistory } from "./PaymentHistory";
import { SystemMessages } from "./SystemMessages";
import { WelcomeHeader } from "./WelcomeHeader";
import { CustomerDashboardLoading } from "./CustomerDashboardLoading";
import type { Subscription } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { SessionManagement } from "./SessionManagement";

export function CustomerDashboard() {
  const {
    customer,
    customerOrders,
    customerSubscriptions,
    loading: contextLoading,
    error,
  } = useAppContext();

  console.log("[customerSubscriptions]", customerSubscriptions);
  const { user } = useAuth();
  const router = useRouter();

  const isLoading = contextLoading || !customer;

  if (isLoading) {
    return <CustomerDashboardLoading />;
  }

  if (error || !customer) {
    return (
      <div className="text-center text-red-500">
        <p>Error loading dashboard.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Find the most relevant subscription. Prioritize 'active', then fall back to the most recently created one.
  const getRelevantSubscription = (
    subscriptions: Subscription[]
  ): Subscription | undefined => {
    if (!subscriptions || subscriptions.length === 0) {
      return undefined;
    }

    const statusPriority: Record<string, number> = {
      active: 1,
      on_trial: 2,
      paused: 3,
      past_due: 4,
      unpaid: 5,
      cancelled: 6,
      expired: 7,
    };

    const sortedSubs = [...subscriptions].sort((a, b) => {
      // Sort by status priority first
      const statusA = statusPriority[a.status] || 99;
      const statusB = statusPriority[b.status] || 99;
      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // If statuses are the same, sort by creation date (newest first)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return sortedSubs[0];
  };

  const relevantSubscription = getRelevantSubscription(customerSubscriptions);

  return (
    <>
      <div className="space-y-8">
        <WelcomeHeader
          name={customer.name}
          email={customer.email}
          photoURL={user?.photoURL}
          onEditProfile={() => router.push("/dashboard/settings")}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <div className="lg:col-span-2">
            <SubscriptionDetails
              subscription={relevantSubscription}
              customer={customer}
            />
          </div>
          <div className="lg:col-span-1 flex">
            <SystemMessages subscription={relevantSubscription} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8">
          <SessionManagement />
          <PaymentHistory orders={customerOrders} />
        </div>
      </div>
    </>
  );
}
