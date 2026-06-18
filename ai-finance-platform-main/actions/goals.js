"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateWithFallback } from "@/lib/ollama";

export async function createGoal(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const goal = await db.financialGoal.create({
      data: {
        name: data.name,
        targetAmount: parseFloat(data.targetAmount),
        currentAmount: parseFloat(data.currentAmount || 0),
        deadline: data.deadline ? new Date(data.deadline) : null,
        userId: user.id,
      },
    });

    const serializedGoal = {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    };

    revalidatePath("/goals");
    return { success: true, data: serializedGoal };
  } catch (error) {
    console.error("Create Goal Error:", error);
    throw new Error(error.message);
  }
}

export async function getGoals() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const goals = await db.financialGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return goals.map(g => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
    }));
  } catch (error) {
    console.error("Get Goals Error:", error);
    return [];
  }
}

export async function deleteGoal(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    await db.financialGoal.delete({
      where: { id, userId: user.id },
    });

    revalidatePath("/goals");
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getGoalPlan(goalId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const goal = await db.financialGoal.findUnique({
      where: { id: goalId },
      include: { 
        user: { 
          include: { 
            transactions: { 
              where: { type: "EXPENSE" },
              take: 30, 
              orderBy: { date: 'desc' } 
            } 
          } 
        } 
      }
    });

    if (!goal) throw new Error("Goal not found");

    const remaining = Number(goal.targetAmount || 0) - Number(goal.currentAmount || 0);

    // Validate data for Gemini
    const safeTx = (goal.user?.transactions || []).map(t => ({
      category: t.category || "other",
      amount: Number(t.amount || 0).toFixed(2),
      desc: t.description || "No description"
    }));

    const prompt = `
      Create a step-by-step financial plan to achieve this goal for the user:
      Goal Name: ${goal.name}
      Target Amount: ₹${Number(goal.targetAmount || 0).toFixed(2)}
      Already Saved: ₹${Number(goal.currentAmount || 0).toFixed(2)}
      Remaining to Save: ₹${Math.max(0, remaining).toFixed(2)}
      Deadline: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No specific deadline'}
      
      User's Recent Expenses for Context:
      ${safeTx.map(t => `- ${t.category}: ₹${t.amount} (${t.desc})`).join("\n")}
      
      Provide an actionable plan in exactly 3 sections:
      1. **Monthly Targets**: Break down how much to save monthly/weekly.
      2. **Expense Cutting**: Identify 3 specific areas where they can save.
      3. **Strategic Advice**: Tips for this type of goal.
      
      Use professional, motivating markdown.
      Always format currency using the Indian Rupee symbol (₹) instead of dollars ($).
    `;

    console.log(`Generating Goal Plan for ${goal.id} [${goal.name}]`);
    const text = await generateWithFallback(prompt);
    
    if (!text) {
      throw new Error("AI responded with an empty result");
    }

    return text;
  } catch (error) {
    console.error("CRITICAL: Goal Plan Error:", error);
    throw new Error(error.message || "Failed to generate goal plan");
  }
}
