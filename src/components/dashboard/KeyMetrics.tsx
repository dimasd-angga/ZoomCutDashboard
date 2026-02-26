
import type { Subscriber, Subscription } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, UserX, UserCheck, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useLanguage } from '../LanguageProvider';

function calculatePercentageChange(current: number, previous: number) {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    if (current === previous) {
        return 0;
    }
    return ((current - previous) / previous) * 100;
}

const ChangeIndicator = ({ change }: { change: number }) => {
    const colorClass = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground';
    
    // Special case for inactive subscribers where an increase is "bad" (red)
    const inactiveColorClass = change > 0 ? 'text-red-500' : change < 0 ? 'text-green-500' : 'text-muted-foreground';

    if (change === 0) {
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    if (change > 0) {
        return <ArrowUp className="h-4 w-4 text-green-500" />;
    }
    return <ArrowDown className="h-4 w-4 text-red-500" />;
};

const InactiveChangeIndicator = ({ change }: { change: number }) => {
    if (change === 0) {
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    // Note: for inactive subscribers, an increase is "bad" (up arrow is red)
    if (change > 0) {
        return <ArrowUp className="h-4 w-4 text-red-500" />;
    }
    // A decrease is "good" (down arrow is green)
    return <ArrowDown className="h-4 w-4 text-green-500" />;
};


export function KeyMetrics({ subscribers, orders, subscriptions }: { subscribers: Subscriber[], orders: any[], subscriptions: Subscription[] }) {
  const { t } = useLanguage();
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const endOfThisMonth = endOfMonth(now);
  const startOfLastMonth = startOfMonth(subMonths(now, 1));
  const endOfLastMonth = endOfMonth(subMonths(now, 1));

  // Total Income
  const incomeThisMonth = orders
    .filter(o => isWithinInterval(new Date(o.created_at), { start: startOfThisMonth, end: endOfThisMonth }) && o.status === 'paid')
    .reduce((acc, order) => acc + (order.total ?? 0), 0);
  const incomeLastMonth = orders
    .filter(o => isWithinInterval(new Date(o.created_at), { start: startOfLastMonth, end: endOfLastMonth }) && o.status === 'paid')
    .reduce((acc, order) => acc + (order.total ?? 0), 0);
  const incomeChange = calculatePercentageChange(incomeThisMonth, incomeLastMonth);

  // New Subscribers
  const newSubscribersThisMonth = subscriptions.filter(s => isWithinInterval(new Date(s.created_at), { start: startOfThisMonth, end: endOfThisMonth })).length;
  const newSubscribersLastMonth = subscriptions.filter(s => isWithinInterval(new Date(s.created_at), { start: startOfLastMonth, end: endOfLastMonth })).length;
  const newSubscribersChange = calculatePercentageChange(newSubscribersThisMonth, newSubscribersLastMonth);

  // Newly Inactive Subscribers
  const newlyInactiveThisMonth = subscriptions.filter(
    (sub) => (sub.status === 'cancelled' || sub.status === 'expired') && sub.updated_at && isWithinInterval(new Date(sub.updated_at), { start: startOfThisMonth, end: endOfThisMonth })
  ).length;
  const newlyInactiveLastMonth = subscriptions.filter(
    (sub) => (sub.status === 'cancelled' || sub.status === 'expired') && sub.updated_at && isWithinInterval(new Date(sub.updated_at), { start: startOfLastMonth, end: endOfLastMonth })
  ).length;
  const inactiveChange = calculatePercentageChange(newlyInactiveThisMonth, newlyInactiveLastMonth);

  // New Trial Users
  const newTrialUsersThisMonth = subscriptions.filter(s => s.status === 'on_trial' && isWithinInterval(new Date(s.created_at), { start: startOfThisMonth, end: endOfThisMonth })).length;
  const newTrialUsersLastMonth = subscriptions.filter(s => s.status === 'on_trial' && isWithinInterval(new Date(s.created_at), { start: startOfLastMonth, end: endOfLastMonth })).length;
  const trialUsersChange = calculatePercentageChange(newTrialUsersThisMonth, newTrialUsersLastMonth);
  
  const totalIncome = orders.reduce((acc, order) => acc + (order.total ?? 0), 0);
  
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getInactiveChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500';
    if (change < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-sidebar">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('total_income_title')}</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(totalIncome / 100).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground flex items-center">
            <ChangeIndicator change={incomeChange} />
            <span className={getChangeColor(incomeChange)}>
              {incomeChange.toFixed(1)}%
            </span>
            &nbsp;{t('from_last_month')}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-sidebar">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('active_subscribers_title')}</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newSubscribersThisMonth}</div>
           <p className="text-xs text-muted-foreground flex items-center">
            <ChangeIndicator change={newSubscribersChange} />
            <span className={getChangeColor(newSubscribersChange)}>
              {newSubscribersChange.toFixed(1)}%
            </span>
            &nbsp;{t('from_last_month')}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-sidebar">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('inactive_subscribers_title')}</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newlyInactiveThisMonth}</div>
          <p className="text-xs text-muted-foreground flex items-center">
            <InactiveChangeIndicator change={inactiveChange} />
            <span className={getInactiveChangeColor(inactiveChange)}>
              {inactiveChange.toFixed(1)}%
            </span>
            &nbsp;{t('from_last_month')}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-sidebar">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('trial_users_title')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newTrialUsersThisMonth}</div>
           <p className="text-xs text-muted-foreground flex items-center">
            <ChangeIndicator change={trialUsersChange} />
            <span className={getChangeColor(trialUsersChange)}>
              {trialUsersChange.toFixed(1)}%
            </span>
            &nbsp;{t('from_last_month')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
