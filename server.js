import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import "dotenv/config";

// If you're using a .env file, uncomment the next two lines:
// import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const publicDir = path.join(__dirname, "public");
const indexPath = path.join(publicDir, "index.html");

app.use(cors());
app.use(express.json());

// No-cache for development
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(express.static(publicDir));

app.get("/", (req, res) => {
  console.log("✅ Serving / from:", indexPath);
  res.sendFile(indexPath);
});

// ✅ OpenAI client (server-side only)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = String(req.body?.message || "").trim();
    if (!userMessage) return res.json({ reply: "Say something and try again." });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        reply:
          "Server missing OPENAI_API_KEY. Set it in PowerShell or a .env file, then restart the server.",
      });
    }

    // Responses API (recommended)
    const response = await client.responses.create({
      model: "gpt-5-mini", // ✅ your requested model :contentReference[oaicite:1]{index=1}
      input: [
        {
          role: "system",
          content:
            "You are a friendly, concise voice assistant inside a 3D avatar demo. Keep replies under 2 short sentences unless asked for details.",
        },
        { role: "user", content: userMessage },
      ],
    }); // :contentReference[oaicite:2]{index=2}

    // Extract text from the response
    const replyText =
      response.output_text?.trim() ||
      "Sorry — I couldn’t generate a reply.";

    res.json({ reply: replyText });
  } catch (err) {
    console.error("❌ /chat error:", err);

    // Common helpful error handling
    const msg =
      (err?.error && JSON.stringify(err.error)) ||
      err?.message ||
      "Unknown error";

    res.status(500).json({
      reply:
        "Server error while calling OpenAI. Check your terminal for details.\n" +
        msg,
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log("✅ Public folder:", publicDir);
});
