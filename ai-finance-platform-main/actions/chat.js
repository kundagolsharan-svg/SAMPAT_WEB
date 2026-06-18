"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ollama";

export async function getChatResponse(message) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        accounts: true,
        transactions: {
          orderBy: { date: "desc" },
          take: 50,
        },
        budgets: true,
      },
    });

    if (!user) throw new Error("User not found");

    // Prepare context for RAG
    const context = `
      User: ${user.name || "User"}
      Accounts: ${user.accounts.map(a => `${a.name} (${a.type}): ₹${a.balance}`).join(", ")}
      Recent Transactions:
      ${user.transactions.map(t => `- ${t.date.toDateString()}: ${t.description} (${t.category}) ${t.type === "EXPENSE" ? "-" : "+"}₹${t.amount}`).join("\n")}
      Budgets:
      ${user.budgets.map(b => `- Current Budget: ₹${b.amount}`).join("\n")}
    `;

    const prompt = `
      You are SAMPAT AI, a highly knowledgeable and friendly financial advisor. 
      You have two roles:
      1. **Personal Dashboard Assistant**: Use the provided financial context (user accounts and transactions) to answer specific questions about their spending, budgets, and habits.
      2. **General Financial Expert**: Answer any general financial questions (investment advice, saving tips, financial terms) even if they aren't directly related to the user's data.

      SAMPAT Design Principles:
      - Be accurate, concise, and professional.
      - Use **Markdown** formatting: bold numbers, bulleted lists for clarity.
      - Always format currency using the Indian Rupee symbol (₹) instead of dollars ($).
      - If the data isn't enough for a specific question, tell them how they can start tracking that info.
      
      User's Financial Context (Use if relevant):
      ${context}

      User Message: ${message}
    `;

    return await generateWithFallback(prompt);
  } catch (error) {
    console.error("Chat Error:", error);
    throw new Error(error.message || "Failed to get response from AI");
  }
}
