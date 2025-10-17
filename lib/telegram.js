import axios from "axios";
import "dotenv/config";

const { TELEGRAM_BOT_TOKEN } = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ Не найден TELEGRAM_BOT_TOKEN. Смотрите .env.example");
  process.exit(1);
}

/* клиент Telegram Bot API */
const tgAPI = axios.create({
  baseURL: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
});

/* отправка простого текста */
export async function sendMessage(chatId, text, extra = {}) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra
  };
  return tgAPI.post("/sendMessage", payload);
}

/* установка webhook (один раз) */
export async function setWebhook(url) {
  return tgAPI.get("/setWebhook", { params: { url } });
}
