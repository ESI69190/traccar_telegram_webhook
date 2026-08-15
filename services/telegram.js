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
  { command: "assoc", description: "Associate phone and Telegram account" },
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
    assoc: "Associate phone and Telegram account",
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
    assoc: "Associer téléphone et compte Telegram",
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
    assoc: "Asociar teléfono y cuenta de Telegram",
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
    assoc: "Associar telefone e conta do Telegram",
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
    assoc: "Telefon ve Telegram hesabını ilişkilendir",
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
    assoc: "Связать телефон и аккаунт Telegram",
    track: "Отслеживать местоположение и статус устройства",
    history: "Показать историю позиций устройства",
    status: "Показать сводку по устройству",
    engine: "Отправить команду двигателя on/off",
    commands: "Отправить пользовательскую команду",
    orders: "Управлять заказами",
    positions: "Список последних позиций",
    reports: "Сгенерировать отчет"
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
      "telegramSendMessage: BOT_TOKEN missing, message not sent: " + text
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
