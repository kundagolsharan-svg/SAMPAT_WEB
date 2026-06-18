require('dotenv').config();
const { getActionModel } = require('../lib/gemini');

async function test() {
  console.log("Starting Robust AI Test...");
  try {
    const model = await getActionModel();
    console.log("Successfully obtained model:", model.model);
    console.log("Testing generation...");
    const res = await model.generateContent("Hi");
    console.log("AI Response:", res.response.text());
  } catch (e) {
    console.error("EXPECTED ERROR / TEST RESULT:", e.message);
  }
}

test();
