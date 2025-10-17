import axios from "axios";
import "dotenv/config";

const { TELEGRAM_BOT_TOKEN } = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ Не задан TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const tgAPI = axios.create({
  baseURL: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
});

/* отправка простого сообщения */
export async function sendMessage(chatId, text, extra = {}) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra
  };
  return tgAPI.post("/sendMessage", payload);
}

/* установить webhook (один раз) */
export async function setWebhook(url) {
  return tgAPI.get("/setWebhook", { params: { url } });
}
