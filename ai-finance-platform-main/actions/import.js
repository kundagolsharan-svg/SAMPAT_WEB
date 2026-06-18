"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
const pdfModule = require("pdf-parse");
import { generateWithFallback } from "@/lib/ollama";

// Robustly discover the PDF parser from the module
const { PDFParse } = require("pdf-parse");

async function parsePdf(buffer) {
  try {
    console.log(`[PDF Parser] Buffer received: ${buffer?.length || 0} bytes. Running extraction...`);
    
    // Buffer received might be a Uint8Array from the caller
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    
    // Always cleanup
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }
    
    if (!data || !data.text) {
      throw new Error("PDF was read but no text was found. It might be a scanned image.");
    }
    return data.text;
  } catch (error) {
    console.error("PDF Parsing Error Detail:", error);
    // Be very specific about the error to help the user
    const errorMsg = error.message || "Unknown error";
    if (errorMsg.includes("payload") || errorMsg.includes("worker")) {
      throw new Error("PDF parsing failed due to a worker conflict. Try a different browser or clear your server cache.");
    }
    throw new Error(`PDF Error: ${errorMsg}. Check if PDF is encrypted.`);
  }
}

export async function importTransactions(formData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const file = formData.get("file");
    const accountId = formData.get("accountId");
    const fileType = file.name.split(".").pop().toLowerCase();

    if (!accountId) throw new Error("Please select an account for import");

    let transactions = [];

    if (fileType === "csv") {
      console.log(`Starting CSV import for file: ${file.name}`);
      const text = await file.text();
      const results = Papa.parse(text, { header: true });
      console.log(`CSV parsed. Extracted ${results.data?.length || 0} rows. Mapping with AI...`);
      transactions = await mapDataToTransactions(results.data);
    } else if (fileType === "pdf") {
      console.log(`Starting PDF import for file: ${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      // Explicitly use Uint8Array to satisfy strict "payload" argument checks
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfText = await parsePdf(uint8Array);
      console.log(`PDF text extracted (${pdfText?.length || 0} characters). Mapping with AI...`);
      transactions = await mapDataToTransactions(pdfText);
    } else {
      throw new Error(`Unsupported file type: .${fileType}. Please upload CSV or PDF.`);
    }

    if (transactions && transactions.length > 0) {
      // 1. Local de-duplication (unique within this batch)
      const uniqueBatchTransactions = transactions.filter((t, index, self) =>
        index === self.findIndex((inner) => (
          inner.description === t.description &&
          inner.amount === t.amount &&
          inner.date === t.date &&
          inner.type === t.type
        ))
      );

      // 2. Global de-duplication (check against database)
      // Fetch user's existing transactions to prevent duplicates across uploads
      const existingTransactions = await db.transaction.findMany({
        where: { userId: user.id },
        select: { description: true, amount: true, date: true, type: true }
      });

      const finalTransactions = uniqueBatchTransactions.filter((t) => {
        const isDuplicate = existingTransactions.some((existing) => 
          existing.description?.toLowerCase().trim() === t.description?.toLowerCase().trim() &&
          existing.amount.toNumber() === parseFloat(t.amount) &&
          new Date(existing.date).toDateString() === new Date(t.date).toDateString() &&
          existing.type === t.type
        );
        return !isDuplicate;
      });

      if (finalTransactions.length === 0) {
        return { success: true, count: 0, message: "No new transactions found (all were duplicates)." };
      }

      // Create transactions and update account balance
      const totalChange = finalTransactions.reduce(
        (acc, t) => acc + (t.type === "EXPENSE" ? -parseFloat(t.amount) : parseFloat(t.amount)),
        0
      );

      await db.$transaction([
        ...finalTransactions.map((t) =>
          db.transaction.create({
            data: {
              type: t.type,
              amount: t.amount,
              description: t.description,
              date: new Date(t.date),
              category: t.category,
              userId: user.id,
              accountId: accountId,
            },
          })
        ),
        db.account.update({
          where: { id: accountId },
          data: { balance: { increment: totalChange } },
        }),
      ]);

      revalidatePath("/dashboard");
      revalidatePath(`/account/${accountId}`);
      return { success: true, count: finalTransactions.length };
    }

    return { success: false, message: "No valid transactions found in the file." };
  } catch (error) {
    console.error("Import Error:", error);
    throw new Error(error.message || "Failed to import transactions");
  }
}

async function mapDataToTransactions(data) {
  const isCSV = Array.isArray(data);
  let chunks = [];

  // 1. Chunking Logic
  if (isCSV) {
    // Split CSV into batches of 50 rows
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(JSON.stringify(data.slice(i, i + chunkSize)));
    }
    console.log(`[Import] CSV split into ${chunks.length} chunks of ${chunkSize} rows each.`);
  } else {
    // Split PDF text into batches of 8,000 characters (safe context window)
    const chunkSize = 8000;
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    console.log(`[Import] PDF split into ${chunks.length} chunks of ${chunkSize} characters each.`);
  }

  if (chunks.length === 0) {
    throw new Error("No data found to extract. Please check your file.");
  }

  let allTransactions = [];

  // 2. Iterative AI Extraction
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[Import] Processing chunk ${i + 1}/${chunks.length}...`);
    
    const prompt = `
      You are a financial data extractor. Extract ALL transaction records from the following ${isCSV ? "CSV data batch" : "bank/wallet statement content (Batch " + (i+1) + "/" + chunks.length + ")"}.
      
      Data Content:
      ${chunks[i]}
      
      Rules:
      - Extract EVERY UNIQUE transaction you can find in this batch.
      - For each transaction return a JSON object with EXACTLY these fields:
        - amount: positive number (e.g. 150.00). 
          STRICT RULES FOR AMOUNT & CURRENCY ACCURACY:
          1. All amounts are in Indian Rupees (INR).
          2. NO SCALING: If the source says "5" or "5.00", return 5.0. NEVER return 500 or multiply by 100.
          3. If the source says "150.00", return 150.0. NEVER return 15000.
          4. The decimal point (".") is a separator. "5.00" has two zeros AFTER the decimal, making it 5 units.
          5. DO NOT treat the last two digits as cents if there is no decimal point (e.g., "500" is 500, not 5.00).
          6. Comma (",") is ONLY a thousand separator (e.g., "1,500.00" -> 1500).
          
          EXAMPLES:
          - "5.00" -> 5.0
          - "150.00" -> 150.0
          - "2,500" -> 2500.0
          - "50" -> 50.0
          
          STRICT WARNING: Accuracy is the top priority. One wrong amount makes the entire system useless. READ THE NUMBERS EXACTLY.
        - date: ISO 8601 date string (e.g. "2024-01-15T00:00:00.000Z")
        - description: short string describing the transaction (merchant name, transfer note, etc.)
        - type: either "INCOME" or "EXPENSE"
        - category: one of: housing, transportation, groceries, utilities, entertainment, food, shopping, healthcare, education, personal, travel, insurance, gifts, bills, other-expense
          
          SMART CATEGORIZATION RULES:
          1. If the description mentions "motor", "fuel", "petrol", "parking", or "service", use "transportation".
          2. If the description mentions "cold drinks", "beverages", or "soda", use "food" if it looks like a restaurant/cafe.
          3. Use best judgment for other categories based on description keywords.
          
      - Payments, debits, "Dr", negative signs = EXPENSE
      - Credits, refunds, "Cr", positive signs = INCOME
      - Only respond with a valid JSON array. No explanation, no markdown. Just the JSON array.
      - If no transactions found in this batch, return [].
    `;

    try {
      const rawText = await generateWithFallback(prompt);
      const match = rawText.match(/\[[\s\S]*\]/);
      let textToParse = rawText.replace(/```(?:json)?\n?/g, "").trim();
      
      if (match) {
        textToParse = match[0];
      }
      
      const parsed = JSON.parse(textToParse);
      if (Array.isArray(parsed)) {
        allTransactions = [...allTransactions, ...parsed];
        console.log(`[Import] Chunk ${i + 1} complete. Extracted ${parsed.length} items.`);
      }
    } catch (err) {
      console.warn(`[Import] Error processing chunk ${i + 1}:`, err.message);
      // Continue with next chunk instead of failing the whole file
    }
  }

  console.log(`[Import] Total extraction complete. Total items: ${allTransactions.length}`);
  return allTransactions;
}
