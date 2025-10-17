import {
  getAllUsers,
  upsertUser,
  getMessagesForDay,
  logSent
} from "../lib/airtable.js";
import { sendMessage } from "../lib/telegram.js";

export default async function handler(req, res) {
  try {
    const users = await getAllUsers();

    for (const rec of users) {
      const { TelegramID, DaysCount = 0, StartDate, Timezone = "" } = rec.fields;
      const chatId = Number(TelegramID);
      const newDayCount = Number(DaysCount) + 1; // «следующий» день

      // обновляем счётчик в базе
      await upsertUser(chatId, StartDate, newDayCount, Timezone);

      // берём сообщения, подходящие под текущий день
      const msgs = await getMessagesForDay(newDayCount);
      if (!msgs.length) continue; // если ничего нет – пропускаем

      // выбираем одно случайное (можно отправить их все)
      const chosen = msgs[Math.floor(Math.random() * msgs.length)];
      const sent = await sendMessage(chatId, chosen.Message);

      // логируем отправку (для аналитики / отладки)
      await logSent(chatId, sent.data.result.message_id, chosen.Message);
    }

    return res.json({ ok: true, processed: users.length });
  } catch (err) {
    console.error("❌ Ошибка cron‑задачи:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
