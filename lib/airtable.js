import axios from "axios";
import "dotenv/config";

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error("❌ Не заданы AIRTABLE_API_KEY / AIRTABLE_BASE_ID");
  process.exit(1);
}

/* -------------------  клиент Airtable  ------------------- */
const api = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
  headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
});

/* ---------- Users ---------- */
export async function getUser(tgId) {
  const formula = `{TelegramID} = ${tgId}`;
  const { data } = await api.get("/Users", {
    params: { filterByFormula: formula }
  });
  return data.records[0] ?? null;
}

export async function upsertUser(tgId, startDate, daysCount, timezone) {
  const existing = await getUser(tgId);
  const fields = {
    TelegramID: Number(tgId),
    StartDate: startDate,
    DaysCount: Number(daysCount),
    Timezone: timezone || ""
  };
  if (existing) {
    await api.patch(`/Users/${existing.id}`, { fields });
    return { id: existing.id, fields };
  }
  const { data } = await api.post("/Users", { fields });
  return data;
}

/* ---------- Messages ---------- */
export async function getMessagesForDay(day) {
  // таблица Messages → поля: Day (Number) и Message (Long text)
  const formula = `{Day} = ${day}`;
  const { data } = await api.get("/Messages", {
    params: { filterByFormula: formula }
  });
  return data.records.map(r => r.fields); // массив { Day: N, Message: "..." }
}

/* ---------- Log (optional) ---------- */
export async function logSent(tgId, msgId, text = "") {
  try {
    await api.post("/Log", {
      fields: {
        TelegramID: Number(tgId),
        MessageID: Number(msgId),
        SentAt: new Date().toISOString(),
        MessageText: text
      }
    });
  } catch (e) {
    console.error("⚠️ Ошибка записи логов:", e.message);
  }
}

/* ---------- Helper: все пользователи ---------- */
export async function getAllUsers() {
  const { data } = await api.get("/Users", { params: { pageSize: 100 } });
  return data.records;
}
