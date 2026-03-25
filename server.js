import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import yaml from "js-yaml";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Load MODDES YAML brain
let moddesConfig = null;
function loadConfig() {
  if (!moddesConfig) {
    const raw = fs.readFileSync("./moddes-knowledge-v0.3.yaml", "utf8");
    moddesConfig = yaml.load(raw);
  }
  return moddesConfig;
}

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  const config = loadConfig();

  const systemPrompt = `
You are MODDES, the Core AI Engine of Jmod Co.
Here is your configuration and division map:

${JSON.stringify(config, null, 2)}

Answer using this knowledge.
  `;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "No reply.";

    res.json({ reply });
  } catch (err) {
    console.error("MODDES Server Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Render will set PORT
const PORT = process.env.PORT || 3000;
app.post("/debbie", async (req, res) => {
  const type = req.body.type || "trivia"; // trivia | challenge | word

  const prompts = {
    trivia: `Generate 7 trivia questions for a sharp woman born in the mid-1950s. 
Focus on the 1960s–1990s: pop culture, history, music, TV, news. 
Light sprinkling of 2000s–2020s. 
Return ONLY valid JSON array, no markdown:
[{"q":"...","opts":["A","B","C","D"],"a":0,"decade":"1970s"}]`,

    challenge: `Generate 1 daily brain challenge: a short logic puzzle, pattern, or sequence question. 
Return ONLY valid JSON: {"prompt":"...","answer":"...","hint":"..."}`,
  };

  const systemPrompt = prompts[type] || prompts.trivia;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: systemPrompt }],
      temperature: 0.8,
    });

    const raw = completion.choices?.[0]?.message?.content || "[]";
    const parsed = JSON.parse(raw);
    res.json({ data: parsed });
  } catch (err) {
    console.error("Debbie endpoint error:", err);
    res.status(500).json({ error: "Failed to generate content" });
  }
});
app.listen(PORT, () => console.log(`MODDES backend running on port ${PORT}`));
