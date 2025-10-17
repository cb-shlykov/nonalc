import {
  getAllUsers,
  upsertUser,
  getMessagesForDay,
  logSent
} from "../../lib/airtable.js";
import { sendMessage } from "../../lib/telegram.js";

export default async function handler(req, res) {
  try {
    const users = await getAllUsers();

    for (const rec of users) {
      const { TelegramID, DaysCount = 0, StartDate, Timezone = "" } = rec.fields;
      const chatId = Number(TelegramID);
      const newDay = Number(DaysCount) + 1; // следующий день

      // обновляем счётчик в Airtable
      await upsertUser(chatId, StartDate, newDay, Timezone);

      // получаем сообщения, подходящие к текущему дню
      const msgs = await getMessagesForDay(newDay);
      if (!msgs.length) continue; // ничего не найдено – пропускаем

      // выбираем случайное сообщение
      const chosen = msgs[Math.floor(Math.random() * msgs.length)];
      const sent = await sendMessage(chatId, chosen.Message);

      // сохраняем в лог
      await logSent(chatId, sent.data.result.message_id, chosen.Message);
    }

    return res.json({ ok: true, processed: users.length });
  } catch (err) {
    console.error("❌ Ошибка cron‑задачи:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
