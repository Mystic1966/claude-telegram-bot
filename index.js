import TelegramBot from "node-telegram-bot-api";
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

// Telegram bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true
  }
});

// AWS Bedrock client
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

// Simple rate limit
let lastRequestTime = 0;

// Message handler
bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;

  // ⏱ Rate limiting (2 sec cooldown)
  const now = Date.now();
  if (now - lastRequestTime < 2000) {
    return bot.sendMessage(chatId, "⏳ Please wait a moment...");
  }
  lastRequestTime = now;

  // ✂️ Limit input size
  const userText = msg.text.slice(0, 500);

  try {
    const command = new InvokeModelCommand({
      // ✅ Working model (region prefixed)
      modelId: "us.anthropic.claude-3-sonnet-20240229-v1:0",

      contentType: "application/json",
      accept: "application/json",

      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 150, // 🔥 reduced to avoid throttling
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userText
              }
            ]
          }
        ]
      })
    });

    const response = await client.send(command);

    const data = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    const reply =
      data?.content?.[0]?.text || "No response from Claude";

    bot.sendMessage(chatId, reply);

  } catch (err) {
    console.error("FULL ERROR:", JSON.stringify(err, null, 2));

    if (err.name === "ThrottlingException") {
      return bot.sendMessage(chatId, "⚠️ Too many requests. Try again in a few seconds.");
    }

    bot.sendMessage(chatId, "⚠️ Claude error — check logs");
  }
});

// Prevent crashes
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("REJECTION:", err);
});
