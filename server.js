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
app.listen(PORT, () => console.log(`MODDES backend running on port ${PORT}`));
