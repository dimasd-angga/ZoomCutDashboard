import { getSubscriptions as getLemonSqueezySubscriptions } from "@/lib/lemonsqueezy";
import {
  getSubscriptions as getFirebaseSubscriptions,
  storeAnalyticsData,
} from "@/lib/firebase";
import { NextResponse, NextRequest } from "next/server";
import type { Subscription, Subscriber } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestamps = (obj: any): any => {
  for (const key in obj) {
    if (obj[key] instanceof Timestamp) {
      obj[key] = obj[key].toDate().toISOString();
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      convertTimestamps(obj[key]);
    }
  }
  return obj;
};

const formatStatus = (status: string) => {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const STATUS_PRIORITY: Record<string, number> = {
  active: 1,
  on_trial: 2,
  paused: 3,
  past_due: 4,
  unpaid: 5,
  cancelled: 6,
  expired: 7,
  archived: 8,
};

const SUCCESS_STATUSES = new Set([
  "active",
  "on_trial",
  "paused",
  "past_due",
  "unpaid",
]);

const getCurrentDate = () => new Date().toISOString();

const toTimestamp = (value?: string | null) =>
  value ? new Date(value).getTime() : 0;

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  return { start, end };
};

const isActiveOrValidSubscription = (subscription: Subscription) => {
  // A subscription is valid if it has a successful status
  if (!SUCCESS_STATUSES.has(subscription.status)) {
    return false;
  }

  const now = Date.now();
  const renewTimestamp = toTimestamp(subscription.renews_at);
  const endsTimestamp = toTimestamp(subscription.ends_at);
  const trialEndsTimestamp = toTimestamp(subscription.trial_ends_at);

  // For active/on_trial subscriptions, check if they have future dates
  if (subscription.status === 'active' || subscription.status === 'on_trial') {
    // Check if any future date exists
    const hasFutureDate = 
      (renewTimestamp > 0 && renewTimestamp > now) ||
      (endsTimestamp > 0 && endsTimestamp > now) ||
      (trialEndsTimestamp > 0 && trialEndsTimestamp > now);
    
    return hasFutureDate;
  }

  // For other successful statuses (paused, past_due, unpaid), include them
  return true;
};

const getFutureRenewalScore = (subscription: Subscription) => {
  const renewTimestamp = toTimestamp(subscription.renews_at);
  const endsTimestamp = toTimestamp(subscription.ends_at);
  const now = Date.now();

  const futureTimestamps = [renewTimestamp, endsTimestamp]
    .filter((ts) => ts > now)
    .sort((a, b) => b - a);

  return futureTimestamps[0] ?? 0;
};

const pickDefinitiveSubscription = (
  subscriptions: Subscription[]
): Subscription | undefined => {
  if (!subscriptions.length) return undefined;

  const validSubscriptions = subscriptions.filter(isActiveOrValidSubscription);
  const candidates =
    validSubscriptions.length > 0 ? validSubscriptions : subscriptions;

  const sorted = [...candidates].sort((a, b) => {
    // 1. Prioritize valid subscriptions
    const aValid = validSubscriptions.includes(a) ? 0 : 1;
    const bValid = validSubscriptions.includes(b) ? 0 : 1;
    if (aValid !== bValid) return aValid - bValid;

    // 2. Prioritize by status (active > on_trial > others)
    const statusDiff =
      (STATUS_PRIORITY[a.status as keyof typeof STATUS_PRIORITY] ?? 99) -
      (STATUS_PRIORITY[b.status as keyof typeof STATUS_PRIORITY] ?? 99);
    if (statusDiff !== 0) return statusDiff;

    // 3. Among same status, prioritize by latest future renewal date
    const futureRenewDiff = getFutureRenewalScore(b) - getFutureRenewalScore(a);
    if (futureRenewDiff !== 0) return futureRenewDiff;

    // 4. Fall back to most recently updated
    const updatedDiff = toTimestamp(b.updated_at) - toTimestamp(a.updated_at);
    if (updatedDiff !== 0) return updatedDiff;

    // 5. Finally, most recently created
    return toTimestamp(b.created_at) - toTimestamp(a.created_at);
  });

  const definitive = sorted[0];

  console.log(
    "[pickDefinitiveSubscription]",
    JSON.stringify(
      {
        candidateCount: candidates.length,
        validSubscriptionsCount: validSubscriptions.length,
        candidates: candidates.map((sub) => ({
          id: sub.id,
          status: sub.status,
          statusPriority: STATUS_PRIORITY[sub.status as keyof typeof STATUS_PRIORITY] ?? 99,
          renews_at: sub.renews_at,
          ends_at: sub.ends_at,
          futureRenewalScore: getFutureRenewalScore(sub),
          updated_at: sub.updated_at,
          created_at: sub.created_at,
        })),
        definitive: definitive
          ? {
              id: definitive.id,
              status: definitive.status,
              statusPriority: STATUS_PRIORITY[definitive.status as keyof typeof STATUS_PRIORITY] ?? 99,
              renews_at: definitive.renews_at,
              ends_at: definitive.ends_at,
              futureRenewalScore: getFutureRenewalScore(definitive),
              updated_at: definitive.updated_at,
              created_at: definitive.created_at,
            }
          : null,
      },
      null,
      2
    )
  );

  return definitive;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  try {
    const lsSubscriptionsResponse = await getLemonSqueezySubscriptions(
      email ?? undefined
    );

    console.log("[lsSubscriptionsResponse]", lsSubscriptionsResponse);

    const lsSubscriptions = (lsSubscriptionsResponse?.data || []).map(
      (s: any) => ({
        id: String(s.id),
        ...s.attributes,
      })
    ) as Subscription[];

    console.log(
      "[lsSubscriptions mapped]",
      JSON.stringify(
        {
          count: lsSubscriptions.length,
          subscriptions: lsSubscriptions.map((sub) => ({
            id: sub.id,
            status: sub.status,
            user_email: sub.user_email,
            renews_at: sub.renews_at,
            created_at: sub.created_at,
          })),
        },
        null,
        2
      )
    );

    const fbSubscriptions = await getFirebaseSubscriptions(email ?? undefined);

    const fbSubscriptionsAsStrings = fbSubscriptions.map((sub) => {
      const converted = convertTimestamps({ ...sub });
      // Manually add status_formatted if it doesn't exist
      if (!converted.status_formatted) {
        converted.status_formatted = formatStatus(converted.status);
      }
      return converted;
    });

    // Combine all subscriptions per user email
    const subscriptionGroups = new Map<string, Subscription[]>();

    const addToGroup = (subscription: Subscription) => {
      const userEmail = subscription.user_email?.toLowerCase();
      if (!userEmail) return;

      const group = subscriptionGroups.get(userEmail) ?? [];
      const existingIndex = group.findIndex(
        (sub) => sub.id === subscription.id
      );

      if (existingIndex >= 0) {
        group[existingIndex] = subscription;
      } else {
        group.push(subscription);
      }

      subscriptionGroups.set(userEmail, group);
    };

    fbSubscriptionsAsStrings.forEach(addToGroup);
    lsSubscriptions.forEach(addToGroup);

    console.log(
      "[subscriptionGroups]",
      JSON.stringify(
        {
          requestedEmail: email,
          groupCount: subscriptionGroups.size,
          emails: Array.from(subscriptionGroups.keys()),
          groupDetails: Array.from(subscriptionGroups.entries()).map(([email, subs]) => ({
            email,
            count: subs.length,
            subscriptions: subs.map((sub) => ({
              id: sub.id,
              status: sub.status,
              renews_at: sub.renews_at,
            })),
          })),
        },
        null,
        2
      )
    );

    let combinedSubscriptions: Subscription[] = [];

    if (email) {
      const definitive = pickDefinitiveSubscription(
        subscriptionGroups.get(email.toLowerCase()) ?? []
      );
      combinedSubscriptions = definitive ? [definitive] : [];
    } else {
      combinedSubscriptions = Array.from(subscriptionGroups.values())
        .map((subs) => pickDefinitiveSubscription(subs))
        .filter((sub): sub is Subscription => Boolean(sub));
    }

    console.log(
      "[combinedSubscriptions]",
      JSON.stringify(
        {
          requestedEmail: email,
          count: combinedSubscriptions.length,
          statuses: combinedSubscriptions.map((sub) => sub.status),
          ids: combinedSubscriptions.map((sub) => sub.id),
        },
        null,
        2
      )
    );

    // Sync the definitive LS data back to Firebase for consistency
    if (lsSubscriptions.length > 0) {
      await storeAnalyticsData("subscriptions", lsSubscriptions);
    }

    return NextResponse.json({ data: combinedSubscriptions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
