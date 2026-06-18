const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });
require("dotenv").config(); // Also try current dir if needed

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No API key found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testKey() {
  console.log("Checking API Key:", apiKey.substring(0, 8) + "...");
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Attempting generated content with gemini-1.5-flash...");
    
    // Attempt generation
    const result = await model.generateContent("Say hello world in 1 word.");
    const response = await result.response;
    
    console.log("✅ SUCCESS!");
    console.log("Response text:", response.text().trim());
    console.log("\n-> Your API key is ACTIVE and ALLOWS generation on the free tier!");
    
  } catch (error) {
    console.error("❌ FAILED to generate content.");
    console.error("Error Code/Status:", error.status || "Unknown");
    console.error("Error Message:", error.message);
    
    if (error.message.includes("429") || error.message.includes("quota")) {
      console.log("\n⚠️ DIAGNOSIS: QUOTA EXCEEDED (Limit 0)");
      console.log("This key is being blocked by Google's billing/quota limits. This means:");
      console.log("1. The key was just created and the free tier hasn't activated yet (takes 30-120 mins).");
      console.log("2. Or, you are in a region where the Free Tier is legally unavailable (like the UK, Switzerland, or EEA).");
      console.log("\nFix: Generate a new key in a BRAND NEW project in Google AI Studio, or wait. Do NOT attach a billing account if you want it to remain 100% free.");
    }
  }
}

testKey();
