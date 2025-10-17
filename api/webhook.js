import { json } from "express";
import { upsertUser } from "../lib/airtable.js";
import { sendMessage } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const update = req.body;
  if (!update.message) return res.json({ ok: true });

  const chatId = update.message.chat.id;
  const text = (update.message.text || "").trim();

  if (text === "/start") {
    await sendMessage(
      chatId,
      `👋 Привет! Я помогу тебе отслеживать путь к трезвости.\n💬 Напиши, сколько дней ты уже не пьёшь:\n- <b>0</b> – сегодня первый день\n- <b>5</b> – уже 5 дней\n- любое другое число`
    );
    return res.json({ ok: true });
  }

  if (text.toLowerCase() === "/reset" || text.toLowerCase() === "reset") {
    await sendMessage(
      chatId,
      `🔄 Давай начнём заново! Введи количество дней без алкоголя (0 – первый день).`
    );
    return res.json({ ok: true });
  }

  const days = Number(text);
  if (!Number.isNaN(days) && days >= 0) {
    const today = new Date().toISOString().split("T")[0];
    const timezone = update.message.from?.language_code || "en";

    await upsertUser(chatId, today, days + 1, timezone);
    await sendMessage(
      chatId,
      `✅ Записано: у тебя уже <b>${days + 1}</b> день(дней) без алкоголя!\n🚀 Буду присылать полезные факты каждый день.`
    );
    return res.json({ ok: true });
  }

  await sendMessage(
    chatId,
    `❓ Я не понял твоё сообщение.\nВведите число дней (например <b>0</b>, <b>7</b>) или используйте /reset.`
  );
  return res.json({ ok: true });
}
