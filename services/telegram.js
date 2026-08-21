// services/telegram.js
import axios from "axios";
import { escapeMarkdown } from "./security.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = BOT_TOKEN
  ? "https://api.telegram.org/bot" + BOT_TOKEN
  : null;

// Bot command definitions (command identifiers must remain identical across languages)
const BOT_COMMANDS = [
  { command: "start", description: "Start the bot and show available commands" },
  { command: "assoc", description: "Securely connect your Traccar account" },
  { command: "track", description: "Track device location and status" },
  { command: "history", description: "Show device position history" },
  { command: "status", description: "Show device summary" },
  { command: "engine", description: "Send engine on/off command" },
  { command: "commands", description: "Send custom command to device" },
  { command: "orders", description: "Manage orders" },
  { command: "positions", description: "List recent positions" },
  { command: "reports", description: "Generate reports" }
];

// Localized command descriptions
const COMMAND_DESCRIPTIONS = {
  en: {
    start: "Start the bot and show available commands",
    assoc: "Securely connect your Traccar account",
    track: "Track device location and status",
    history: "Show device position history",
    status: "Show device summary",
    engine: "Send engine on/off command",
    commands: "Send custom command to device",
    orders: "Manage orders",
    positions: "List recent positions",
    reports: "Generate reports"
  },
  fr: {
    start: "Démarrer le bot et afficher les commandes disponibles",
    assoc: "Connecter votre compte Traccar de manière sécurisée",
    track: "Suivre la localisation et l'état d'un équipement",
    history: "Afficher l'historique des positions",
    status: "Afficher le résumé de l'équipement",
    engine: "Envoyer commande moteur on/off",
    commands: "Envoyer commande personnalisée",
    orders: "Gérer les ordres",
    positions: "Lister les positions récentes",
    reports: "Générer des rapports"
  },
  es: {
    start: "Iniciar el bot y mostrar comandos disponibles",
    assoc: "Conectar tu cuenta de Traccar de forma segura",
    track: "Rastrear ubicación y estado del dispositivo",
    history: "Mostrar historial de posiciones",
    status: "Mostrar resumen del dispositivo",
    engine: "Enviar comando de motor on/off",
    commands: "Enviar comando personalizado",
    orders: "Gestionar órdenes",
    positions: "Listar posiciones recientes",
    reports: "Generar reportes"
  },
  pt: {
    start: "Iniciar o bot e mostrar comandos disponíveis",
    assoc: "Conectar sua conta do Traccar de forma segura",
    track: "Rastrear localização e status do dispositivo",
    history: "Mostrar histórico de posições",
    status: "Mostrar resumo do dispositivo",
    engine: "Enviar comando de motor on/off",
    commands: "Enviar comando personalizado",
    orders: "Gerenciar ordens",
    positions: "Listar posições recentes",
    reports: "Gerar relatórios"
  },
  tr: {
    start: "Botu başlat ve kullanılabilir komutları göster",
    assoc: "Traccar hesabınızı güvenli bir şekilde bağlayın",
    track: "Cihaz konumunu ve durumunu takip et",
    history: "Cihaz pozisyon geçmişini göster",
    status: "Cihaz özetini göster",
    engine: "Motor on/off komutu gönder",
    commands: "Özel komut gönder",
    orders: "Siparişleri yönet",
    positions: "Son pozisyonları listele",
    reports: "Rapor oluştur"
  },
  ru: {
    start: "Запустить бота и показать доступные команды",
    assoc: "Надежно подключить ваш аккаунт Traccar",
    track: "Отслеживать местоположение и статус устройства",
    history: "Показать историю позиций устройства",
    status: "Показать сводку по устройству",
    engine: "Отправить команду двигателя on/off",
    commands: "Отправить пользовательскую команду",
    orders: "Управлять заказами",
    positions: "Список последних позиций",
    reports: "Сгенерировать отчет"
  },
  zh: {
    start: "激活机器人并显示可用命令",
    assoc: "安全连接您的 Traccar 账户",
    track: "追踪设备位置和状态",
    history: "显示设备位置历史",
    status: "显示设备摘要",
    engine: "发送引擎开/关命令",
    commands: "发送自定义命令",
    orders: "管理订单",
    positions: "列出最近位置",
    reports: "生成报告"
  },
  ja: {
    start: "ボットを起動して利用可能なコマンドを表示",
    assoc: "Traccar アカウントを安全に接続",
    track: "デバイスの位置とステータスを追跡",
    history: "デバイスの位置履歴を表示",
    status: "デバイスの概要を表示",
    engine: "エンジン オン/オフ コマンドを送信",
    commands: "カスタム コマンドを送信",
    orders: "注文を管理",
    positions: "最近の位置情報を一覧表示",
    reports: "レポートを生成"
  },
  de: {
    start: "Bot starten und verfügbare Befehle anzeigen",
    assoc: "Traccar-Konto sicher verbinden",
    track: "Gerätestandort und -status verfolgen",
    history: "Gerätepositionsverlauf anzeigen",
    status: "Gerätezusammenfassung anzeigen",
    engine: "Motor-Befehl senden",
    commands: "Benutzerdefinierten Befehl senden",
    orders: "Aufträge verwalten",
    positions: "Letzte Positionen auflisten",
    reports: "Bericht erstellen"
  },
  ko: {
    start: "봇 시작 및 사용 가능한 명령어 표시",
    assoc: "Traccar 계정 안전하게 연결",
    track: "기기 위치 및 상태 추적",
    history: "기기 위치 기록 표시",
    status: "기기 요약 표시",
    engine: "엔진 온/오프 명령 전송",
    commands: "사용자 정의 명령 전송",
    orders: "주문 관리",
    positions: "최근 위치 목록 보기",
    reports: "보고서 생성"
  },
  it: {
    start: "Avvia il bot e mostra i comandi disponibili",
    assoc: "Collega in modo sicuro il tuo account Traccar",
    track: "Traccia posizione e stato del dispositivo",
    history: "Mostra cronologia posizioni dispositivo",
    status: "Mostra riepilogo dispositivo",
    engine: "Invia comando motore on/off",
    commands: "Invia comando personalizzato",
    orders: "Gestisci ordini",
    positions: "Elenca posizioni recenti",
    reports: "Genera report"
  }
};

/**
 * Register bot commands with Telegram.
 * Registers a default command menu (no language_code) and localized menus for each supported language.
 */
export async function registerBotCommands() {
  if (!TELEGRAM_API) {
    console.warn("registerBotCommands: BOT_TOKEN missing, commands not registered");
    return false;
  }

  try {
    // 1. Register default command menu (fallback)
    const defaultCommands = BOT_COMMANDS.map((cmd) => ({
      command: cmd.command,
      description: cmd.description
    }));

    const defaultResp = await axios.post(TELEGRAM_API + "/setMyCommands", {
      commands: defaultCommands
    }, { validateStatus: () => true });

    if (defaultResp.status !== 200) {
      console.error("setMyCommands default failed:", defaultResp.data?.description);
      return false;
    }

    // 2. Register localized command menus
    const locales = Object.keys(COMMAND_DESCRIPTIONS);
    for (const locale of locales) {
      const localizedCommands = BOT_COMMANDS.map((cmd) => ({
        command: cmd.command,
        description: COMMAND_DESCRIPTIONS[locale][cmd.command] || cmd.description
      }));

      const localeResp = await axios.post(TELEGRAM_API + "/setMyCommands", {
        commands: localizedCommands,
        language_code: locale
      }, { validateStatus: () => true });

      if (localeResp.status !== 200) {
        console.error(`setMyCommands ${locale} failed:`, localeResp.data?.description);
        // Continue with other locales even if one fails
      }
    }

    console.log("Bot commands registered successfully (default + localized)");
    return true;
  } catch (err) {
    console.error("registerBotCommands error:", err?.toString());
    return false;
  }
}

/**
 * Verify current bot command registration (for testing/debugging).
 */
export async function getBotCommands() {
  if (!TELEGRAM_API) return null;
  try {
    const resp = await axios.post(TELEGRAM_API + "/getMyCommands", {}, {
      validateStatus: () => true
    });
    return resp.data;
  } catch (err) {
    console.error("getMyCommands error:", err?.toString());
    return null;
  }
}

export async function telegramSendMessage(chatId, text, options) {
  if (!TELEGRAM_API) {
    console.warn(
      "telegramSendMessage: BOT_TOKEN missing, message not sent"
    );
    return null;
  }
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || "MarkdownV2",
      reply_markup: options?.reply_markup
    };
    const resp = await axios.post(TELEGRAM_API + "/sendMessage", payload, {
      validateStatus: () => true
    });
    if (resp.status !== 200) {
      console.log("<- Telegram sendMessage", {
        status: resp.status,
        description: resp.data?.description,
        text: text.slice(0, 200)
      });
    } else {
      console.log("<- Telegram sendMessage", { status: resp.status });
    }
    return resp.data;
  } catch (err) {
    console.error("Telegram sendMessage error:", err?.toString());
    return null;
  }
}

/**
 * Send a plain-text message safely in MarkdownV2 parse mode.
 * The entire text is escaped; use telegramSendMessage directly when you need
 * intentional MarkdownV2 formatting.
 */
export async function sendPlainText(chatId, text, options) {
  return telegramSendMessage(chatId, escapeMarkdown(text), {
    ...options,
    parse_mode: "MarkdownV2"
  });
}

/**
 * Edit a message text safely in MarkdownV2 parse mode.
 * The entire text is escaped; use editMessageText directly when you need
 * intentional MarkdownV2 formatting.
 */
export async function editPlainText(chatId, messageId, text, options) {
  return editMessageText(chatId, messageId, escapeMarkdown(text), {
    ...options,
    parse_mode: "MarkdownV2"
  });
}

/**
 * Answer a callback query to stop the loading indicator on the client.
 */
export async function answerCallbackQuery(callbackQueryId, options = {}) {
  if (!TELEGRAM_API) {
    console.warn("answerCallbackQuery: BOT_TOKEN missing");
    return null;
  }
  try {
    const payload = {
      callback_query_id: callbackQueryId,
      text: options.text,
      show_alert: options.show_alert || false,
      url: options.url,
      cache_time: options.cache_time || 0
    };
    const resp = await axios.post(TELEGRAM_API + "/answerCallbackQuery", payload, {
      validateStatus: () => true
    });
    return resp.data;
  } catch (err) {
    console.error("answerCallbackQuery error:", err?.toString());
    return null;
  }
}

/**
 * Edit the text of a message sent by the bot.
 */
export async function editMessageText(chatId, messageId, text, options = {}) {
  if (!TELEGRAM_API) {
    console.warn("editMessageText: BOT_TOKEN missing");
    return null;
  }
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options.parse_mode || "MarkdownV2",
      reply_markup: options.reply_markup
    };
    const resp = await axios.post(TELEGRAM_API + "/editMessageText", payload, {
      validateStatus: () => true
    });
    // Telegram returns HTTP 400 "message is not modified" when neither the text
    // nor the reply markup changed (e.g. the user pressed Refresh immediately).
    // This is a benign no-op, not an application error: do not retry, do not
    // send an additional message, and do not log it as an error.
    if (
      resp.status === 400 &&
      resp.data?.description &&
      String(resp.data.description).includes("message is not modified")
    ) {
      return { ok: true, unchanged: true };
    }
    if (resp.status !== 200) {
      console.log("<- Telegram editMessageText", {
        status: resp.status,
        description: resp.data?.description
      });
    }
    return resp.data;
  } catch (err) {
    console.error("editMessageText error:", err?.toString());
    return null;
  }
}

/**
 * Edit only the reply markup (inline keyboard) of a message sent by the bot.
 */
export async function editMessageReplyMarkup(chatId, messageId, replyMarkup) {
  if (!TELEGRAM_API) {
    console.warn("editMessageReplyMarkup: BOT_TOKEN missing");
    return null;
  }
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup
    };
    const resp = await axios.post(TELEGRAM_API + "/editMessageReplyMarkup", payload, {
      validateStatus: () => true
    });
    if (resp.status !== 200) {
      console.log("<- Telegram editMessageReplyMarkup", {
        status: resp.status,
        description: resp.data?.description
      });
    }
    return resp.data;
  } catch (err) {
    console.error("editMessageReplyMarkup error:", err?.toString());
    return null;
  }
}