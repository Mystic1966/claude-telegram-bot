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

// Message handler
bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userText = msg.text;

  try {
    const command = new InvokeModelCommand({
      // ✅ YOUR EXACT MODEL
      modelId: "anthropic.claude-3-haiku-20240307",

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

    const reply =
      data?.content?.[0]?.text || "No response from Claude";

    bot.sendMessage(chatId, reply);

  } catch (err) {
    console.error("FULL ERROR:", JSON.stringify(err, null, 2));

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
