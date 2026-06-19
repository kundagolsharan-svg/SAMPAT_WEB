"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ollama";

export async function getChatResponse(message, conversationHistory = []) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        accounts: true,
        transactions: {
          orderBy: { date: "desc" },
          take: 100,
        },
        budgets: true,
      },
    });

    if (!user) throw new Error("User not found");

    // Build financial context
    const totalIncome = user.transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = user.transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Group spending by category
    const categorySpending = {};
    user.transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        categorySpending[t.category] =
          (categorySpending[t.category] || 0) + Number(t.amount);
      });

    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`)
      .join(", ");

    const context = `
User Name: ${user.name || "User"}
Accounts: ${user.accounts.map((a) => `${a.name} (${a.type}): ₹${Number(a.balance).toFixed(2)}`).join(", ")}
Total Income (all time): ₹${totalIncome.toFixed(2)}
Total Expenses (all time): ₹${totalExpense.toFixed(2)}
Net Savings: ₹${(totalIncome - totalExpense).toFixed(2)}
Budget: ${user.budgets.map((b) => `₹${Number(b.amount).toFixed(2)}`).join(", ") || "Not set"}
Top Spending Categories: ${topCategories || "No data"}
Recent Transactions (last 20):
${user.transactions
  .slice(0, 20)
  .map(
    (t) =>
      `- ${new Date(t.date).toLocaleDateString("en-IN")}: ${t.description} | ${t.category} | ${t.type === "EXPENSE" ? "-" : "+"}₹${Number(t.amount).toFixed(2)}`
  )
  .join("\n")}
    `.trim();

    // Build conversation history string
    const historyStr =
      conversationHistory.length > 0
        ? conversationHistory
            .slice(-10) // keep last 10 messages for context
            .map(
              (m) =>
                `${m.role === "user" ? "User" : "SAMPAT AI"}: ${m.content}`
            )
            .join("\n")
        : "";

    const prompt = `
You are SAMPAT AI, an intelligent, friendly, and highly knowledgeable financial advisor chatbot built into the SAMPAT finance platform.

YOUR CAPABILITIES:
1. **Personal Finance Assistant**: Answer questions about the user's own data (accounts, transactions, budgets, spending habits).
2. **General Financial Expert**: Answer any general financial questions (investments, savings, tax tips, financial concepts, market trends, etc.)
3. **Proactive Advisor**: After answering, ALWAYS suggest 2-3 highly relevant follow-up questions the user is likely to ask next, based on the conversation context.

YOUR RESPONSE FORMAT (STRICTLY FOLLOW THIS):
- Use clear Markdown formatting with **bold**, bullet points, and headers where appropriate
- Always use ₹ (Indian Rupee symbol) for all currency values
- Be concise but thorough
- At the END of EVERY response, add a section called "💡 You might also want to ask:" with 2-3 predicted follow-up questions as a numbered list
- These follow-up questions must be highly relevant to what was just discussed

USER'S FINANCIAL CONTEXT (use this when answering personal finance questions):
${context}

${historyStr ? `CONVERSATION HISTORY:\n${historyStr}\n` : ""}
User's Current Message: ${message}

Respond now as SAMPAT AI:`;

    const aiResponse = await generateWithFallback(prompt);
    return { success: true, response: aiResponse };
  } catch (error) {
    console.error("Chat Error:", error);
    return { success: false, error: error.message || "Failed to get AI response" };
  }
}
