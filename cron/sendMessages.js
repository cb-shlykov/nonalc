import {
  getAllUsers,
  upsertUser,
  getMessagesForDay,
  logSent
} from "../lib/airtable.js";
import { sendMessage } from "../lib/telegram.js";

/* Эта функция будет вызываться Vercel‑cron один раз в день (см. vercel.json) */
export default async function handler(req, res) {
  try {
    const users = await getAllUsers();

    for (const rec of users) {
      const { TelegramID, DaysCount = 0, StartDate, Timezone = "" } = rec.fields;
      const chatId = Number(TelegramID);
      const newDayCount = Number(DaysCount) + 1; // +1 — новый день

      // обновляем счётчик
      await upsertUser(chatId, StartDate, newDayCount, Timezone);

      // получаем сообщения, подходящие под текущий день
      const msgs = await getMessagesForDay(newDayCount);

      if (!msgs.length) continue; // если нет сообщений – пропускаем

      // если несколько сообщений на один день — отправляем случайное
      const chosen = msgs[Math.floor(Math.random() * msgs.length)];

      // отправляем
      const sent = await sendMessage(chatId, chosen.Message);
      // логируем (MessageID берём из ответа Telegram)
      await logSent(chatId, sent.data.result.message_id, chosen.Message);
    }

    return res.json({ ok: true, processed: users.length });
  } catch (err) {
    console.error("❌ Ошибка в cron:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
