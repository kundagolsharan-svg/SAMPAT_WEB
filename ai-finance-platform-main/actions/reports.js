"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ollama";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function getMonthlyReportData(month, year) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const serializedTransactions = transactions.map(serializeTransaction);

    // Group by category
    const categoryBreakdown = serializedTransactions.reduce((acc, t) => {
      if (t.type === "EXPENSE") {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});

    // Group by tax category
    const taxBreakdown = serializedTransactions.reduce((acc, t) => {
      if (t.taxCategory) {
        acc[t.taxCategory] = (acc[t.taxCategory] || 0) + t.amount;
      }
      return acc;
    }, {});

    const totalIncome = serializedTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = serializedTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    // AI Summary
    const prompt = `
      You are an expert financial advisor named SAMPAT AI. Summarize this financial data for ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(startDate)} ${year}:
      Total Income: INR ${totalIncome}
      Total Expenses: INR ${totalExpenses}
      Top Expense Categories: ${JSON.stringify(categoryBreakdown)}
      Tax-relevant Expenses: ${JSON.stringify(taxBreakdown)}
      
      Instructions:
      1. All amounts are in Indian Rupees (INR). Use the "₹" symbol or "INR" in your response.
      2. Provide a brief, professional summary (max 3-4 sentences) of the month's performance.
      3. Provide 3-5 SPECIFIC, ACTIONABLE recommendations to improve money flow, cut unnecessary costs, and increase savings based on this data. Format the recommendations clearly.
    `;
    
    const aiSummary = await generateWithFallback(prompt);

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        categoryBreakdown,
        taxBreakdown,
        transactions: serializedTransactions,
        aiSummary,
        period: { month, year }
      },
    };
  } catch (error) {
    console.error("Error fetching report data:", error);
    return { success: false, error: error.message };
  }
}
