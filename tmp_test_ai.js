const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testConnection() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }
  
  console.log("Testing API Key:", apiKey.substring(0, 10) + "...");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'API is working'");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("API Error:", error.message);
  }
}

testConnection();
