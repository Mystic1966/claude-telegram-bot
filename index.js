import TelegramBot from "node-telegram-bot-api";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

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
        messages: [
          { role: "user", content: userText }
        ],
        max_tokens: 300
      })
    });

    const response = await client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));

    const reply = result.content[0].text;

    bot.sendMessage(chatId, reply);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Error talking to Claude");
  }
});
