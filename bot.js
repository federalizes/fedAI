require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Store conversation history per user
const conversations = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (!userMessage) return;

  if (!conversations[chatId]) conversations[chatId] = [];

  conversations[chatId].push({ role: 'user', content: userMessage });

  try {
    bot.sendChatAction(chatId, 'typing');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: 'You are a helpful assistant.',
      messages: conversations[chatId],
    });

    const reply = response.content[0].text;

    conversations[chatId].push({ role: 'assistant', content: reply });

    bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
  }
});

console.log('Bot is running...');
