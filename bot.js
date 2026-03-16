require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Store conversation history per user
const conversations = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (!userMessage) return;

  if (!conversations[chatId]) conversations[chatId] = [];

  conversations[chatId].push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    bot.sendChatAction(chatId, 'typing');

    const chat = model.startChat({ history: conversations[chatId].slice(0, -1) });
    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();

    conversations[chatId].push({ role: 'model', parts: [{ text: reply }] });

    bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
  }
});

console.log('Bot is running...');
