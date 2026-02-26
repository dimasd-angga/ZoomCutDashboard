
'use client';

import * as React from 'react';
import type { Subscriber, Order, Product, Subscription, SystemUpdate, SubscriptionWithCustomer } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { getCustomerByEmail, getSystemUpdates, storeAnalyticsData } from '@/lib/firebase';
import { getOrdersByUserEmail, getSubscriptionsByUserEmail } from '@/lib/lemonsqueezy';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  subscribers: Subscriber[];
  orders: Order[];
  products: Product[];
  subscriptions: Subscription[];
  systemUpdates: SystemUpdate[];
  subscriptionsWithCustomers: SubscriptionWithCustomer[];
  customer: Subscriber | null;
  customerOrders: Order[];
  customerSubscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

async function fetchFromAPI<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch(e) {
            errorData = { error: `Request to ${endpoint} failed with status ${response.status}: ${response.statusText}` };
        }
        console.error(`API Error from ${endpoint} (status ${response.status}):`, errorData);
        throw new Error(errorData.error || `Failed to fetch from ${endpoint}`);
    }
    const data = await response.json();
    return data.data;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [systemUpdates, setSystemUpdates] = React.useState<SystemUpdate[]>([]);
  
  const [customer, setCustomer] = React.useState<Subscriber | null>(null);
  const [customerOrders, setCustomerOrders] = React.useState<Order[]>([]);
  const [customerSubscriptions, setCustomerSubscriptions] = React.useState<Subscription[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const fetchAdminData = React.useCallback(async () => {
    try {
      const [customersData, ordersData, productsData, subscriptionsData, updatesData] = await Promise.all([
        fetchFromAPI<Subscriber[]>('/api/lemonsqueezy/customers'),
        fetchFromAPI<Order[]>('/api/lemonsqueezy/orders'),
        fetchFromAPI<Product[]>('/api/lemonsqueezy/products'),
        fetchFromAPI<Subscription[]>('/api/subscriptions'),
        getSystemUpdates()
      ]);
      
      setSubscribers(customersData);
      setOrders(ordersData);
      setProducts(productsData);
      setSubscriptions(subscriptionsData);
      setSystemUpdates(updatesData);

    } catch (error: any) {
      throw error; // Re-throw to be caught by the main handler
    }
  }, []);

  const fetchCustomerData = React.useCallback(async (email: string, name?: string) => {
    try {
        console.log(`Fetching data for customer: ${email}`);
        const [customerData, ordersResponse, subscriptionsResponse, updatesData] = await Promise.all([
            getCustomerByEmail(email),
            getOrdersByUserEmail({ userEmail: email }),
            fetchFromAPI<Subscription[]>(`/api/subscriptions?email=${encodeURIComponent(email)}`),
            getSystemUpdates()
        ]);
        
        console.log('Subscriptions response from API:', subscriptionsResponse);
        setCustomerSubscriptions(subscriptionsResponse);

        if (customerData) {
            setCustomer(customerData as Subscriber);
        } else if (user) {
            // Fallback for trial user who might not have a `customers` record yet
             setCustomer({
                id: user.uid,
                email: user.email!,
                name: user.displayName || name || 'New User',
                city: null,
                country: null,
                total_revenue_currency: 0,
                mrr: 0,
                status: 'on_trial',
                urls: {},
             });
        }

        setSystemUpdates(updatesData);
        
        const orderData = (ordersResponse?.data || []).map(o => ({ id: String(o.id), ...o.attributes }));
        setCustomerOrders(orderData);
        if (orderData.length > 0) {
            await storeAnalyticsData('orders', orderData);
        }


    } catch (error: any) {
        throw error;
    }
  }, [user]);

  const fetchData = React.useCallback(async () => {
    if (!user || authLoading) return;
    setLoading(true);
    setError(null);
    try {
        if (userRole === 'admin') {
            await fetchAdminData();
        } else if (userRole === 'customer' && user.email) {
            await fetchCustomerData(user.email, user.displayName || undefined);
        }
    } catch (error: any) {
        const errorMessage = error.message || "An unexpected error occurred.";
        setError(errorMessage);
        console.error("Failed to fetch app data:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            fullError: error
        });

        if (errorMessage.includes('LEMON_SQUEEZY_API_KEY')) {
            toast({
                variant: 'destructive',
                title: 'API Key Error',
                description: 'Lemon Squeezy API key is not configured. Please add it to your environment variables.',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Failed to fetch data',
                description: 'Could not retrieve data. Please check the console for details.',
            });
        }
    } finally {
        setLoading(false);
    }
  }, [user, userRole, authLoading, toast, fetchAdminData, fetchCustomerData]);

  React.useEffect(() => {
    if (!authLoading && user) {
        fetchData();
    }
     if (!authLoading && !user) {
        setLoading(false);
    }
  }, [user, authLoading, fetchData]);

  const subscriptionsWithCustomers = React.useMemo(() => {
      // Since subscribers are now fetched from /api/lemonsqueezy/customers, they might not include trial users.
      // We can build a customer map from the subscriptions themselves, as they contain user_name and user_email.
      const customerMap = new Map<string, Subscriber>();
      
      // First, create customer profiles from Lemon Squeezy customers data
      subscribers.forEach(c => customerMap.set(String(c.id), c));

      return subscriptions.map(sub => {
          let customer: Subscriber | undefined = customerMap.get(String(sub.customer_id));
          
          // If customer not found (e.g., for a trial subscription), create a temporary one.
          if (!customer && sub.user_email) {
              customer = {
                  id: String(sub.id), // Use subscription ID as a fallback ID
                  name: sub.user_name,
                  email: sub.user_email,
                  status: sub.status,
                  // Add other necessary subscriber fields with default values
                  city: null,
                  country: null,
                  total_revenue_currency: 0,
                  mrr: 0,
                  urls: {},
              };
          }

          return {
              ...sub,
              customer: customer,
          };
      });
  }, [subscriptions, subscribers]);

  const value = {
    subscribers,
    orders,
    products,
    subscriptions,
    systemUpdates,
    subscriptionsWithCustomers,
    customer,
    customerOrders,
    customerSubscriptions,
    loading,
    error,
    fetchData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
