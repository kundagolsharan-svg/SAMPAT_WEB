"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMonthlyReportData } from "@/actions/reports";
import { downloadMonthlyReport } from "@/lib/download-pdf";
import { FileDown, PieChart, TrendingUp, Wallet, Receipt, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const result = await getMonthlyReportData(selectedMonth, selectedYear);
      if (result.success) {
        setReportData(result.data);
      } else {
        toast.error(result.error || "Failed to fetch report data");
      }
    } catch (error) {
      toast.error("An error occurred while fetching report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear]);

  const handleDownload = () => {
    if (!reportData) return;
    try {
      downloadMonthlyReport(reportData);
      toast.success("PDF Report generated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Financial Reports</h1>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, i) => (
                <SelectItem key={month} value={(i + 1).toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleDownload} disabled={!reportData || loading}>
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Analyzing your finances...</p>
        </div>
      ) : reportData ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Summary Cards */}
          <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{reportData.totalIncome.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>

          <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{reportData.totalExpenses.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
              <PieChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(reportData.totalIncome - reportData.totalExpenses).toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="md:col-span-3 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Financial Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed italic">&ldquo;{reportData.aiSummary}&rdquo;</p>
            </CardContent>
          </Card>

          {/* Tax Breakdown */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Tax Summary</CardTitle>
              <CardDescription>Tax-relevant categorize spend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(reportData.taxBreakdown).length > 0 ? (
                  Object.entries(reportData.taxBreakdown).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between items-center text-sm border-b pb-2">
                      <span className="capitalize">{cat}</span>
                      <span className="font-semibold">₹{amt.toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No tax-tagged transactions found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction List Preview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
              <CardDescription>All activities for this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.transactions.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                    </div>
                    <span className={t.type === "INCOME" ? "text-green-600 font-bold" : "font-bold"}>
                      {t.type === "INCOME" ? "+" : "-"}₹{t.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
                {reportData.transactions.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-4">... and {reportData.transactions.length - 10} more (Download PDF for full list)</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="py-20 flex flex-col items-center justify-center">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No data found for the selected period.</p>
        </Card>
      )}
    </div>
  );
}
