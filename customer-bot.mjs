import TelegramBot from "node-telegram-bot-api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================
const TELEGRAM_TOKEN = "8273007433:AAGBo3UqfzfYPbyyIYE6N1ykblYtP5hrJDg";
const GEMINI_API_KEY = "AIzaSyA3Epvy2LmFUXe78_1olcKTRYzrYfn2AmM";
const OWNER_TELEGRAM_ID = null;

// Provider hiện tại: "flash20" | "flash15"
let currentProvider = "flash20";
let failCountFlash20 = 0;
const FAIL_THRESHOLD = 2; // Sau 2 lần lỗi liên tiếp mới switch
// ============================================================

const SYSTEM_PROMPT = `
Mày là bot hỗ trợ khách hàng của Hoàng Huy — nói chuyện theo đúng phong cách của Huy.

PHONG CÁCH GIAO TIẾP (bắt buộc giữ):
- Tin nhắn NGẮN — tối đa 2-3 dòng mỗi lần. Không bao giờ viết dài dòng.
- Thân thiện, tự nhiên, không cứng nhắc kiểu chatbot
- Xưng "t" với khách quen, "mình" với khách lạ/lần đầu
- Gọi KH là "bạn" hoặc "m" nếu KH tự xưng thân thiện
- Hay dùng: "oke", "oki", "ừ", "hehe", ":v", "thui", "cứ... đi"
- Viết tắt tự nhiên: "ko"=không, "đc"=được, "j"=gì, "vs"=với, "tí"=tí, "tầm"=khoảng
- KHÔNG dùng ngôn ngữ văn hoa, khách sáo, robot
- Thẳng thắn, đi thẳng vào vấn đề

XỬ LÝ TÌNH HUỐNG:
- Hỏi giá: trả lời thẳng nếu biết, ko biết thì "t check lại cho m nhé"
- Không chắc: "t hỏi lại Huy rồi báo m nha"
- KH hỏi kỹ: "m nhắn Huy trực tiếp nha, t chỉ hỗ trợ cơ bản thui"
- KH không rõ: hỏi lại ngắn gọn, 1 câu thôi

VÍ DỤ:
KH: "shop có bán không?" → "Có ku, m cần cái j nhỉ?"
KH: "giá bao nhiêu?" → "Tầm [giá] thui. M lấy mấy cái?"

LĨNH VỰC: [Anh Huy điền vào]
SẢN PHẨM/DỊCH VỤ: [Anh Huy điền vào]
`.trim();

// ── Khởi tạo 2 model Gemini ──────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const modelFlash20 = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: SYSTEM_PROMPT,
});

const modelFlash15 = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: SYSTEM_PROMPT,
});

// ── Hàm gọi từng model ───────────────────────────────────────
async function callGemini20(history, text) {
  const chat = modelFlash20.startChat({ history: history.slice(0, -1) });
  const result = await chat.sendMessage(text);
  return result.response.text().trim();
}

async function callGemini15(history, text) {
  const chat = modelFlash15.startChat({ history: history.slice(0, -1) });
  const result = await chat.sendMessage(text);
  return result.response.text().trim();
}

// ── Logic fallback chính ──────────────────────────────────────
async function callAI(history, text) {
  // Thử Gemini 2.0 Flash trước (trừ khi đã switch sang 1.5)
  if (currentProvider === "flash20") {
    try {
      const reply = await callGemini20(history, text);
      failCountFlash20 = 0; // reset counter nếu thành công
      console.log("⚡ [Gemini 2.0 Flash]");
      return reply;
    } catch (err) {
      failCountFlash20++;
      const isRateLimit =
        err.message?.includes("429") ||
        err.message?.includes("quota") ||
        err.message?.includes("RESOURCE_EXHAUSTED");

      console.warn(
        `⚠️  Gemini 2.0 Flash lỗi (lần ${failCountFlash20}): ${err.message}`
      );

      if (failCountFlash20 >= FAIL_THRESHOLD || isRateLimit) {
        console.log("🔄 Switch → Gemini 1.5 Flash (backup)");
        currentProvider = "flash15";
        // Retry ngay bằng 1.5
        const reply = await callGemini15(history, text);
        console.log("✅ [Gemini 1.5 Flash]");
        return reply;
      }
      throw err; // Chưa đủ ngưỡng → throw để bot báo lỗi tạm
    }
  } else {
    // Đang dùng 1.5, thỉnh thoảng thử lại 2.0 (mỗi 50 request)
    try {
      const reply = await callGemini15(history, text);
      console.log("🟡 [Gemini 1.5 Flash]");

      // Retry về 2.0 sau mỗi 50 tin nhắn
      if (Math.random() < 0.02) {
        console.log("🔁 Thử quay lại Gemini 2.0 Flash...");
        currentProvider = "flash20";
        failCountFlash20 = 0;
      }
      return reply;
    } catch (err) {
      console.warn(`⚠️  Gemini 1.5 Flash cũng lỗi: ${err.message}`);
      // Cả 2 đều lỗi — thử lại một lần cuối với 2.0
      console.log("🆘 Thử lại Gemini 2.0 Flash lần cuối...");
      const reply = await callGemini20(history, text);
      currentProvider = "flash20";
      failCountFlash20 = 0;
      return reply;
    }
  }
}

// ── Bot setup ─────────────────────────────────────────────────
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const conversationHistory = new Map();

console.log("🤖 Bot @hoanghuy_open_claw_bot đang chạy...");
console.log("⚡ Primary:  Gemini 2.0 Flash");
console.log("🔄 Fallback: Gemini 1.5 Flash");
console.log("⏳ Chờ tin nhắn...\n");

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || "Khách";
  const userText = msg.text;
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
  const groupName = msg.chat.title || "";

  if (!userText || userText === "/start") return;
  if (msg.from.is_bot) return;

  const contextLabel = isGroup ? `[GROUP: ${groupName}]` : "[DM]";
  console.log(`\n📩 ${contextLabel} ${userName}: ${userText}`);

  bot.sendChatAction(chatId, "typing");

  try {
    const historyKey = isGroup ? `group_${chatId}` : `dm_${userId}`;
    if (!conversationHistory.has(historyKey)) conversationHistory.set(historyKey, []);
    const history = conversationHistory.get(historyKey);

    const contextualText = isGroup ? `[${userName} nói]: ${userText}` : userText;
    history.push({ role: "user", parts: [{ text: contextualText }] });
    if (history.length > 30) history.splice(0, history.length - 30);

    const replyText = await callAI(history, contextualText);

    history.push({ role: "model", parts: [{ text: replyText }] });

    await bot.sendMessage(chatId, replyText);
    console.log(`✅ Bot: ${replyText}`);

    if (OWNER_TELEGRAM_ID) {
      await bot
        .sendMessage(
          OWNER_TELEGRAM_ID,
          `📬 ${contextLabel}\n👤 ${userName}: "${userText}"\n🤖 "${replyText}"`
        )
        .catch(() => {});
    }
  } catch (error) {
    console.error("❌ Lỗi cuối cùng:", error.message);
    if (!isGroup) await bot.sendMessage(chatId, "Tí trả lời sau nha :v");
  }
});

bot.on("polling_error", (err) => console.error("❌ Polling:", err.message));

process.on("SIGINT", () => {
  bot.stopPolling();
  process.exit(0);
});
