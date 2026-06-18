import { Suspense } from "react";
import {
  getUserAccounts,
  getDashboardData,
  getSpendingInsights,
} from "@/actions/dashboard";
import { DashboardMain } from "./_components/dashboard-main";

export default async function DashboardPage() {
  const [accounts, transactions, spendingInsights] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
    getSpendingInsights(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm font-semibold animate-pulse">
          Loading dashboard…
        </div>
      }
    >
      <DashboardMain
        accounts={accounts || []}
        transactions={transactions || []}
        spendingInsights={spendingInsights || []}
      />
    </Suspense>
  );
}
