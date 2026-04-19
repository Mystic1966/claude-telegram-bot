import TelegramBot from "node-telegram-bot-api";
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

// ENV VARIABLES
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

// MESSAGE HANDLER
bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userText = msg.text;

  try {
    const command = new InvokeModelCommand({
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

    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    const reply = responseBody.content[0].text;

    bot.sendMessage(chatId, reply);

  } catch (error) {
    console.error("ERROR:", error);
    bot.sendMessage(chatId, "Error talking to Claude");
  }
});
