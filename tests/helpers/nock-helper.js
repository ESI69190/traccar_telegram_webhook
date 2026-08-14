import nock from "nock";

const TRACCAR_BASE = "https://tricard.eyeshield-informatique.tech";
const TELEGRAM_BASE = "https://api.telegram.org";

export function setupTraccarNock() {
  return nock(TRACCAR_BASE);
}

export function setupTelegramNock() {
  return nock(TELEGRAM_BASE);
}

export function cleanAll() {
  nock.cleanAll();
}
