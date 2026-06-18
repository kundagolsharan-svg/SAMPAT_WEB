"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { generateWithFallback } from "@/lib/ollama";

export async function getBehaviorAnalysis() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        transactions: {
          where: { type: "EXPENSE" },
          orderBy: { date: "desc" },
          take: 150,
        },
      },
    });

    if (!user || !user.transactions || user.transactions.length === 0) {
      return { 
        analysis: "Not enough transaction data to analyze yet. Start adding your expenses to see insights!",
        categoryTotals: {} 
      };
    }

    const categoryTotals = user.transactions.reduce((acc, t) => {
      const cat = t.category;
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {});

    const prompt = `
      Analyze the following financial behavior for ${user.name || "the user"}:
      
      Spending Summary by Category:
      ${Object.entries(categoryTotals).map(([cat, total]) => `- ${cat}: ₹${total.toFixed(2)}`).join("\n")}
      
      Recent Transactions:
      ${user.transactions.slice(0, 20).map(t => `- ${new Date(t.date).toLocaleDateString()}: ${t.description} (₹${Number(t.amount).toFixed(2)})`).join("\n")}
      
      Please provide:
      1. **Spending Patterns**: What are the main habits?
      2. **Trend Detection**: Are there any irregular or increasing costs?
      3. **Actionable Insights**: 3 specific tips to improve financial health based on this data.
      
      Format the response using professional markdown with a premium, insightful tone.
    `;

    const analysis = await generateWithFallback(prompt);
    return { 
      analysis, 
      categoryTotals 
    };
  } catch (error) {
    console.error("Behavior Analysis Error:", error);
    throw new Error(error.message || "Failed to generate behavior analysis");
  }
}
