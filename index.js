import TelegramBot from "node-telegram-bot-api";
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

// Create bot (polling)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true
  }
});

// AWS client
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

// Message handler
bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userText = msg.text;

  try {
    const command = new InvokeModelCommand({
      // ✅ SAFE MODEL (works in most accounts)
     modelId: "anthropic.claude-haiku-4-5-20251001-v1:0",

      contentType: "application/json",
      accept: "application/json",

      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 300,
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

    const reply = data?.content?.[0]?.text || "No response";

    bot.sendMessage(chatId, reply);

  } catch (err) {
    console.error("ERROR:", err);

    bot.sendMessage(chatId, "⚠️ Error talking to Claude");
  }
});

// Prevent crash
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("REJECTION:", err);
});
