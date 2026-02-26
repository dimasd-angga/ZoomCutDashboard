import {
    type ListCustomers,
    type ListOrders,
    type ListProducts,
    type ListVariants,
    type ListSubscriptions,
    type NewCheckout,
  } from "@lemonsqueezy/lemonsqueezy.js";
  import { Timestamp } from "firebase/firestore";
  
  export type Subscriber = ListCustomers["data"][number]["attributes"] & { id: string };
  export type Order = ListOrders["data"][number]["attributes"] & { id: string };
  export type Product = ListProducts["data"][number]["attributes"] & { id: string };
  export type Subscription = ListSubscriptions["data"][number]["attributes"] & {
    id: string | number;
    price_formatted?: string;
    trial_activated_at?: string;
  };
  export type Variant = ListVariants["data"][number];
  export type SubscriberStatus = ListSubscriptions["data"][number]["attributes"]["status"];
  export interface SystemUpdate {
    id: string;
    type: "app_update" | "message";
    version?: string;
    title?: string;
    description: string;
    link?: string;
    installerLink?: string;
    createdAt: Timestamp;
  }
  export interface SubscriptionWithCustomer extends Subscription {
    customer: Subscriber | undefined;
  }
  