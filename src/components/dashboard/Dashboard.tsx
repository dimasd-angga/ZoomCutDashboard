
'use client';
import { useAppContext } from '@/components/AppContext';
import { DashboardPage } from './DashboardPage';
import { DashboardLoading } from './DashboardLoading';
import { withAuth } from '../withAuth';


function Dashboard() {
  const { subscriptions, orders, products, loading, subscribers } = useAppContext();
  
  if (loading) {
    return <DashboardLoading />;
  }
  
  return <DashboardPage subscriptions={subscriptions} orders={orders} products={products} subscribers={subscribers} />;
}

export default withAuth(Dashboard);
