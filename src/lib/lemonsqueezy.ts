"use server";

import {
  lemonSqueezySetup,
  listCustomers,
  listOrders,
  listProducts,
  listVariants,
  createCheckout as lsCreateCheckout,
  listSubscriptions as lsListSubscriptions,
  cancelSubscription as lsCancelSubscription,
  type ListCustomers,
  type ListOrders,
  type ListProducts,
  type ListVariants,
  type NewCheckout,
  type ListCustomersParams,
  type ListOrdersParams,
  type ListSubscriptionsParams,
  type ListSubscriptions,
  type Checkout,
  type Subscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import "server-only";

const checkApiKey = () => {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LEMON_SQUEEZY_API_KEY is not set in environment variables."
    );
  }
  return apiKey;
};

const checkStoreId = () => {
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error(
      "LEMON_SQUEEZY_STORE_ID is not set in environment variables."
    );
  }
  return storeId;
};

const STORE_ID = checkStoreId();

try {
  const apiKey = checkApiKey();
  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error("Lemon Squeezy API Error!", error);
      throw error;
    },
  });
} catch (error) {
  console.error(error);
}

export async function getCustomers(): Promise<ListCustomers> {
  const { data: customersData, error } = await listCustomers({
    page: { number: 1, size: 100 },
  });
  if (error) {
    throw error;
  }
  return customersData!;
}

export async function getSubscriptions(
  email?: string
): Promise<ListSubscriptions> {
  const params: ListSubscriptionsParams = {
    page: { number: 1, size: 100 },
  };
  if (email) {
    params.filter = { userEmail: email };
  }

  const { data, error } = await lsListSubscriptions(params);
  if (error) {
    throw error;
  }
  return data!;
}

export async function getCustomersByEmail(
  params: ListCustomersParams
): Promise<ListCustomers> {
  const { data: customersData, error } = await listCustomers(params);
  if (error) {
    throw error;
  }
  return customersData!;
}

export async function getOrders(): Promise<ListOrders> {
  const { data: ordersData, error } = await listOrders({
    page: { number: 1, size: 100 },
  });
  if (error) {
    throw error;
  }
  return ordersData!;
}

export async function getOrdersByUserEmail(
  params: ListOrdersParams["filter"]
): Promise<ListOrders> {
  const { data: ordersData, error } = await listOrders({
    filter: params,
    include: ["customer"],
    page: { number: 1, size: 100 },
  });
  if (error) {
    throw error;
  }
  return ordersData!;
}

export async function getSubscriptionsByUserEmail(
  params: ListSubscriptionsParams["filter"]
): Promise<ListSubscriptions> {
  const { data: subscriptionsData, error } = await lsListSubscriptions({
    filter: params,
    include: ["customer"],
    page: { number: 1, size: 100 },
  });
  if (error) {
    throw error;
  }
  return subscriptionsData!;
}

export async function getProducts(): Promise<ListProducts> {
  console.log("[storeId]", STORE_ID);

  const { data: productsData, error } = await listProducts({
    page: { number: 1, size: 100 },
    filter: { storeId: STORE_ID },
  });

  console.log("[productsData]", productsData);
  if (error) {
    throw error;
  }
  return productsData!;
}

export async function getVariants(): Promise<ListVariants> {
  const { data: variantsData, error } = await listVariants({
    page: { number: 1, size: 100 },
  });
  console.log("[variantsData]", variantsData);
  if (error) {
    throw error;
  }
  return variantsData!;
}

export async function createCheckout(
  variantId: number,
  newCheckout: NewCheckout
) {
  const { data, error, statusCode } = await lsCreateCheckout(
    STORE_ID,
    variantId,
    newCheckout
  );
  if (error) {
    throw error;
  }
  return { data, error, statusCode };
}

export async function cancelSubscription(subscriptionId: number | string) {
  const { data, error, statusCode } = await lsCancelSubscription(
    String(subscriptionId)
  );
  if (error) {
    throw error;
  }
  return { data, error, statusCode };
}
