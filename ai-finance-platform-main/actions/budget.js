"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateWithFallback } from "@/lib/ollama";
import { sendEmail } from "./send-email";
import EmailTemplate from "@/emails/template";

export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Get current month's expenses
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function updateBudget(amount) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Update or create budget
    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount,
      },
      create: {
        userId: user.id,
        amount,
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}
export async function resetBudgetAlert() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    await db.budget.update({
      where: { userId: user.id },
      data: { lastAlertSent: null },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting budget alert:", error);
    return { success: false, error: error.message };
  }
}

export async function checkBudgetAlert(userId) {
  try {
    const budget = await db.budget.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            accounts: true,
          },
        },
      },
    });

    if (!budget || budget.user.accounts.length === 0) return;

    const defaultAccount =
      budget.user.accounts.find((acc) => acc.isDefault) ||
      budget.user.accounts[0];

    const budgetAmount = budget.amount.toNumber();

    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const expenses = await db.transaction.aggregate({
      where: {
        userId,
        accountId: defaultAccount.id,
        type: "EXPENSE",
        date: { gte: startDate },
      },
      _sum: { amount: true },
    });

    const totalExpenses = expenses._sum.amount?.toNumber() || 0;
    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    console.log(`Budget: ${budgetAmount}, Expenses: ${totalExpenses}, Percentage: ${percentageUsed.toFixed(1)}%`);

    if (percentageUsed >= 80) {
      console.log("Threshold exceeded! Sending email...");
      const monthName = new Date().toLocaleString("default", {
        month: "long",
      });

      // Generate AI insights for the budget alert
      const insights = await generateBudgetInsights(
        totalExpenses,
        budgetAmount,
        monthName
      );

      const emailResult = await sendEmail({
        to: budget.user.email,
        subject: `Budget Alert for ${defaultAccount.name}`,
        react: EmailTemplate({
          userName: budget.user.name,
          type: "budget-alert",
          data: {
            percentageUsed,
            budgetAmount: budgetAmount.toFixed(1),
            totalExpenses: totalExpenses.toFixed(1),
            accountName: defaultAccount.name,
            insights,
          },
        }),
      });

      console.log("Email send result:", emailResult);

      // Update last alert sent
      await db.budget.update({
        where: { id: budget.id },
        data: { lastAlertSent: new Date() },
      });
    }
  } catch (error) {
    console.error("Error in checkBudgetAlert server action:", error);
  }
}

async function generateBudgetInsights(expenses, budgetAmount, month) {
  const percentageUsed = (expenses / budgetAmount) * 100;

  const prompt = `
    Analyze this budget situation and provide 2 concise, helpful financial advice / insights.
    The user has used ${percentageUsed.toFixed(1)}% of their $${budgetAmount} budget for ${month}.
    Total expenses so far: $${expenses}.

    Focus on:
    - If they are close to the limit (80-100%), suggest where to cut back.
    - If they are over the limit (>100%), suggest how to handle the deficit.
    - Keep it encouraging and practical.

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2"]
  `;

  try {
    const text = await generateWithFallback(prompt);
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating budget insights:", error);
    return [
      "Consider reviewing your recent expenses to identify non-essential spending.",
      "Try to keep your daily spending in check for the rest of the month.",
    ];
  }
}
