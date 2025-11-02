import type {
  MarketInsightPayload,
  MarketInsightTopic,
} from "@/types/dataProps";

const PLACEHOLDER_KEYWORDS = [
  "데이터 미제공",
  "데이터가 제공되지 않았습니다",
  "데이터 없음",
] as const;

const KOREAN_FORMAL_KEYWORDS = [
  "습니다",
  "했습니다",
  "되었습니다",
  "됩니다",
  "입니다",
  "있습니다",
  "없습니다",
  "가능합니다",
  "필요합니다",
  "합니다",
] as const;

const CHG_COLORS = {
  up: "#dc2626",
  down: "#2563eb",
  flat: "#334155",
} as const;

const DEFAULT_BADGE_COLOR = "#0b63f6";

const DEFAULT_PLACEHOLDER = "—";

const SUMMARY_LABELS: Record<string, string> = {
  intraday: "장중",
  breadth: "시장 폭",
  liquidity: "거래·유동성",
  orderbook: "수급",
};

type Primitive = string | number | boolean | null | undefined;

type AnyRecord = Record<string, unknown> | undefined | null;

function nowKstString(): string {
  const fallback = new Date();

  try {
    const parts = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(fallback);

    const mapped = parts.reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

    const year = mapped.year ?? String(fallback.getFullYear());
    const month = mapped.month ?? String(fallback.getMonth() + 1).padStart(2, "0");
    const day = mapped.day ?? String(fallback.getDate()).padStart(2, "0");
    const hour = mapped.hour ?? String(fallback.getHours()).padStart(2, "0");
    const minute = mapped.minute ?? String(fallback.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("KST formatting failed", error);
    }

    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(fallback.getDate()).padStart(2, "0")} ${String(
      fallback.getHours()
    ).padStart(2, "0")}:${String(fallback.getMinutes()).padStart(2, "0")}`;
  }
}

function toNumber(value: Primitive): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function safeGet<T = unknown>(subject: AnyRecord, path: (string | number)[], defaultValue: T): T {
  let cursor: unknown = subject ?? {};
  for (const key of path) {
    if (cursor == null || typeof cursor !== "object") {
      return defaultValue;
    }
    if (Array.isArray(cursor) && typeof key === "number") {
      cursor = cursor[key];
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(cursor, key as string)) {
      return defaultValue;
    }
    cursor = (cursor as Record<string, unknown>)[key as string];
  }
  return (cursor ?? defaultValue) as T;
}

function formatCountCompact(value: Primitive): string {
  const numeric = toNumber(value);
  if (numeric == null) return "";

  if (numeric >= 100_000_000) {
    return `${(numeric / 100_000_000).toFixed(2)}억`;
  }
  if (numeric >= 10_000) {
    return `${(numeric / 10_000).toFixed(2)}만`;
  }
  return Math.round(numeric).toLocaleString();
}

function formatInt(value: Primitive, defaultText: string = DEFAULT_PLACEHOLDER): string {
  const numeric = toNumber(value);
  if (numeric == null) return defaultText;
  return Math.round(numeric).toLocaleString();
}

function formatFloat(
  value: Primitive,
  options: { nd?: number; defaultText?: string } = {}
): string {
  const numeric = toNumber(value);
  if (numeric == null) return options.defaultText ?? DEFAULT_PLACEHOLDER;
  const nd = options.nd ?? 2;
  return numeric.toFixed(nd);
}

function formatPct(
  value: Primitive,
  options: { nd?: number; defaultText?: string } = {}
): string {
  const numeric = toNumber(value);
  if (numeric == null) return options.defaultText ?? DEFAULT_PLACEHOLDER;
  const nd = options.nd ?? 2;
  return `${numeric.toFixed(nd)}%`;
}

function formatWon(value: Primitive): string {
  const numeric = toNumber(value);
  if (numeric == null) return "";

  if (numeric >= 10_000_000_000_000) {
    return `${Math.round(numeric / 1e13 * 10) / 10}조 원`;
  }
  if (numeric >= 100_000_000) {
    return `${Math.round(numeric / 1e8).toLocaleString()}억 원`;
  }
  return `${Math.round(numeric).toLocaleString()}원`;
}

function buildBadge(text: string, color: string = DEFAULT_BADGE_COLOR): string {
  return (
    `<span style="display:inline-block;padding:2px 8px;border:1px solid ${color};` +
    `border-radius:999px;color:${color};font-size:12px;font-weight:700;background:#fff;">${text}</span>`
  );
}

export function resolveChangeColor(value: number | null, fallbackText: string = ""): string {
  if (value != null) {
    if (value > 0) return CHG_COLORS.up;
    if (value < 0) return CHG_COLORS.down;
    return CHG_COLORS.flat;
  }

  if (fallbackText.includes("-")) return CHG_COLORS.down;
  if (fallbackText.includes("+")) return CHG_COLORS.up;
  return CHG_COLORS.flat;
}

function isPlaceholderLine(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_KEYWORDS.some((keyword) => trimmed.includes(keyword));
}

function ensureSentenceFormal(text: string): string {
  if (!text) return "";
  let sentence = text.trim();
  if (!sentence) return "";

  const replacements: Array<[RegExp, string]> = [
    [/해야 한다\.$/, "해야 합니다."],
    [/해야한다\.$/, "해야 합니다."],
    [/할 수 있다\.$/, "할 수 있습니다."],
    [/가능하다\.$/, "가능합니다."],
    [/필요하다\.$/, "필요합니다."],
    [/된다\.$/, "됩니다."],
    [/된다$/, "됩니다."],
    [/했다\.$/, "했습니다."],
    [/한다\.$/, "합니다."],
    [/한다$/, "합니다."],
    [/이다\.$/, "입니다."],
    [/이다$/, "입니다."],
    [/있다\.$/, "있습니다."],
    [/없다\.$/, "없습니다."],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(sentence)) {
      sentence = sentence.replace(pattern, replacement);
      break;
    }
  }

  if (KOREAN_FORMAL_KEYWORDS.some((keyword) => sentence.includes(keyword))) {
    return finalizeFormalSentence(sentence);
  }

  if (!/[.!?…]$/.test(sentence)) {
    sentence += ".";
  }

  if (sentence.endsWith("다.")) {
    sentence = `${sentence.slice(0, -2)}습니다.`;
  }

  return finalizeFormalSentence(
    sentence.endsWith(".") ? `${sentence.slice(0, -1)}입니다.` : `${sentence}입니다.`
  );
}

function finalizeFormalSentence(text: string): string {
  let sentence = text;
  const replacements: Record<string, string> = {
    합니습니다: "합니다",
    입니입니다: "입니다",
    옵니습니다: "옵니다",
    됩니습니다: "됩니다",
    습니다입니다: "입니다",
    니다입니다: "니다",
  };

  for (const [oldValue, newValue] of Object.entries(replacements)) {
    sentence = sentence.replace(new RegExp(`${oldValue}\.`, "g"), `${newValue}.`);
    sentence = sentence.replace(new RegExp(oldValue, "g"), newValue);
  }

  if (!/[.!?…]$/.test(sentence.trim())) {
    sentence = `${sentence.trim()}.`;
  }

  return sentence;
}

function formatCommentHtml(text?: string | null): string {
  if (!text) return DEFAULT_PLACEHOLDER;
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return DEFAULT_PLACEHOLDER;

  const rawParts = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const plainHistory: string[] = [];
  const filtered: string[] = [];

  for (const part of rawParts) {
    const base = part.replace(/[.!?\s]+$/g, "");
    if (!base) continue;
    if (base.startsWith("전략") || base.startsWith("주요 이슈")) continue;

    const normalized = base.replace(/(입니다|니다|다)$/, "");
    const key = (normalized || base).slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);

    const plainCandidate = (normalized || base).replace(/\s+/g, "");
    if (plainHistory.some((prev) => similarity(prev, plainCandidate) > 0.9)) {
      continue;
    }
    plainHistory.push(plainCandidate);

    filtered.push(/[.!?…]$/.test(part) ? part : `${part}.`);
  }

  return filtered.length > 0 ? filtered.join("<br/>") : cleaned;
}

function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const distanceMatrix: number[][] = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i += 1) {
    distanceMatrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    distanceMatrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distanceMatrix[i][j] = Math.min(
        distanceMatrix[i - 1][j] + 1,
        distanceMatrix[i][j - 1] + 1,
        distanceMatrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = distanceMatrix[a.length][b.length];
  return 1 - distance / Math.max(a.length, b.length, 1);
}

function buildSummaryItems(topic: MarketInsightTopic): Array<[string, string]> {
  const items: Array<[string, string]> = [];
  const intraday = topic.intraday as AnyRecord;
  let description: string | undefined;

  if (intraday && Object.keys(intraday).length > 0) {
    const open = formatFloat(safeGet(intraday, ["open"], ""), { nd: 2, defaultText: DEFAULT_PLACEHOLDER });
    const high = formatFloat(safeGet(intraday, ["high"], ""), { nd: 2, defaultText: DEFAULT_PLACEHOLDER });
    const low = formatFloat(safeGet(intraday, ["low"], ""), { nd: 2, defaultText: DEFAULT_PLACEHOLDER });
    const closePos = safeGet(intraday, ["close_pos_text"], "" as string);
    const openDelta = safeGet(intraday, ["open_delta"], "" as string);

    const tails: string[] = [];
    if (closePos) tails.push(`종가는 범위 <b>${closePos}</b> 근처`);
    if (openDelta) tails.push(`(${openDelta})`);

    description = `시가 ${open} → 고가 ${high} · 저가 ${low}`;
    if (tails.length) {
      description += `, ${tails.join(" ")}.`;
    } else {
      description += ".";
    }
  } else {
    description = safeGet(topic, ["sentences", "intraday_flow"], "" as string);
  }

  if (description && !isPlaceholderLine(description)) {
    items.push([SUMMARY_LABELS.intraday, ensureSentenceFormal(description)]);
  }

  const breadth = topic.breadth as AnyRecord;
  if (breadth && Object.keys(breadth).length > 0) {
    const adv = formatInt(safeGet(breadth, ["adv"], ""));
    const unch = formatInt(safeGet(breadth, ["unch"], ""));
    const dec = formatInt(safeGet(breadth, ["dec"], ""));
    const advRatio = safeGet(breadth, ["adv_ratio_text"], "" as string);
    const bias = safeGet(breadth, ["bias_text"], "" as string);
    const advHtml = adv !== DEFAULT_PLACEHOLDER ? `<b>${adv}</b>종목` : DEFAULT_PLACEHOLDER;
    const unchHtml = unch !== DEFAULT_PLACEHOLDER ? `${unch}종목` : DEFAULT_PLACEHOLDER;
    const decHtml = dec !== DEFAULT_PLACEHOLDER ? `<b>${dec}</b>종목` : DEFAULT_PLACEHOLDER;
    const sub = advRatio ? ` (${advRatio})` : "";
    const tail = bias ? ` → <b>${bias}</b>` : "";

    description = `상승 ${advHtml} · 보합 ${unchHtml} · 하락 ${decHtml}${sub}${tail}`;
  } else {
    description = safeGet(topic, ["sentences", "market_breadth"], "" as string);
  }

  if (description && !isPlaceholderLine(description)) {
    let formatted = ensureSentenceFormal(description);
    if (formatted.includes("종목") && !formatted.includes("종목수 기준")) {
      formatted = `${formatted.replace(/\.$/, "")} (모두 종목수 기준입니다.).`;
    }
    items.push([SUMMARY_LABELS.breadth, formatted]);
  }

  const liquidity = topic.liquidity as AnyRecord;
  if (liquidity && Object.keys(liquidity).length > 0) {
    const volume = formatInt(safeGet(liquidity, ["volume"], ""));
    const prevVolume = formatInt(safeGet(liquidity, ["prev_volume"], ""));
    const xVolume = safeGet(liquidity, ["x_volume"], "" as string);
    const value = formatWon(safeGet(liquidity, ["value"], ""));
    const prevValue = formatWon(safeGet(liquidity, ["prev_value"], ""));
    const xValue = safeGet(liquidity, ["x_value"], "" as string);
    const state = safeGet(liquidity, ["state_text"], "—" as string);

    description =
      `거래량 <b>${volume}</b>(전일 ${prevVolume} · <b>${xVolume || DEFAULT_PLACEHOLDER}</b>) · ` +
      `거래대금 <b>${value}</b>(전일 ${prevValue}${xValue ? ` · <b>${xValue}</b>` : ""}) → <b>${state}</b>`;
  } else {
    description = safeGet(topic, ["sentences", "liquidity"], "" as string);
  }

  if (description && !isPlaceholderLine(description)) {
    items.push([SUMMARY_LABELS.liquidity, ensureSentenceFormal(description)]);
  }

  const orderbook = topic.orderbook as AnyRecord;
  if (orderbook && Object.keys(orderbook).length > 0) {
    const bidQty = formatInt(safeGet(orderbook, ["bid_qty"], ""));
    const askQty = formatInt(safeGet(orderbook, ["ask_qty"], ""));
    const bidPct = formatPct(safeGet(orderbook, ["bid_pct"], ""));
    const askPct = formatPct(safeGet(orderbook, ["ask_pct"], ""));
    const net = safeGet(orderbook, ["net_qty_text"], "" as string);

    description = `매수잔량 <b>${bidQty}</b> · 매도잔량 <b>${askQty}</b> · <b>매수 ${bidPct} / 매도 ${askPct}</b>`;
    if (net) description += ` → <b>${net}</b>`;
  } else {
    description = safeGet(topic, ["sentences", "order_flow"], "" as string);
  }

  if (description && !isPlaceholderLine(description)) {
    items.push([SUMMARY_LABELS.orderbook, ensureSentenceFormal(description)]);
  }

  if (items.length === 0) return [];
  if (items.length === 2 && items[0][0] === SUMMARY_LABELS.intraday && items[1][0] === SUMMARY_LABELS.liquidity) {
    items[1] = ["거래", items[1][1]];
  }
  return items;
}

const normalizeCommentBullets = (value?: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
};


function formatDelta(
  chgPoint?: Primitive,
  chgPct?: Primitive,
  chgPointStr: string = "",
  chgPctStr: string = ""
): { text: string; color: string } {
  const point = toNumber(chgPoint);
  const pct = toNumber(chgPct);

  let resolvedPoint = point;
  if (resolvedPoint == null && chgPointStr) {
    const match = chgPointStr.match(/[-+]?\d+(?:\.\d+)?/);
    if (match) resolvedPoint = Number(match[0]);
  }

  let resolvedPct = pct;
  if (resolvedPct == null && chgPctStr) {
    const match = chgPctStr.match(/[-+]?\d+(?:\.\d+)?/);
    if (match) resolvedPct = Number(match[0]);
  }

  const referenceValue = resolvedPct != null ? resolvedPct : resolvedPoint ?? 0;
  const arrow = referenceValue > 0 ? "▲" : referenceValue < 0 ? "▼" : "—";
  const color = referenceValue > 0 ? CHG_COLORS.up : referenceValue < 0 ? CHG_COLORS.down : CHG_COLORS.flat;

  const pointText =
    resolvedPoint != null && Number.isFinite(resolvedPoint)
      ? `${Math.abs(resolvedPoint).toFixed(2)}p`
      : chgPointStr;

  let pctText = chgPctStr;
  if (resolvedPct != null && Number.isFinite(resolvedPct)) {
    const sign = resolvedPct > 0 ? "+" : resolvedPct < 0 ? "-" : "";
    pctText = `(${sign}${Math.abs(resolvedPct).toFixed(2)}%)`;
  }

  const trimmed = `${arrow} ${pointText} ${pctText}`.trim();
  return {
    text: trimmed.replace(/\s+/g, " "),
    color,
  };
}

export interface MarketInsightCardData {
  market: string;
  marketKey?: string;
  price: string;
  deltaText: string;
  deltaColor: string;
  asofText: string;
  summaryItems: Array<{ index: number; title: string; content: string }>;
  commentTitle: string;
  commentBodyHtml: string;
  commentBullets?: string[];
  topics: string[];
}

export function buildMarketInsightCard(
  topic: MarketInsightTopic,
  marketKey?: string
): MarketInsightCardData | null {
  const market = topic.market ?? "MARKET";
  const price = topic.price_str ?? DEFAULT_PLACEHOLDER;
  const delta = formatDelta(topic.chg_point, topic.chg_pct, topic.chg_point_str ?? "", topic.chg_pct_str ?? "");
  const asof = getAsOfText(topic);
  const summaryPairs = buildSummaryItems(topic);

  if (
    summaryPairs.length === 0 &&
    !topic.comment_body &&
    (!Array.isArray(topic.comment_bullets) || topic.comment_bullets.length === 0)
  ) {
    return null;
  }

  const summaryItems = summaryPairs.map(([title, content], index) => ({
    index: index + 1,
    title,
    content,
  }));

  const commentTitle = topic.comment_title ?? "마켓 코멘트";
  const commentBullets = normalizeCommentBullets(topic.comment_bullets);
  const commentBodyHtml = commentBullets.length
    ? ""
    : formatCommentHtml(topic.comment_body ?? "");
  const commentBulletHtml = commentBullets.length
    ? commentBullets.map((bullet) => formatCommentHtml(bullet))
    : undefined;
  const topics = [
    ...(typeof topic.topic_category === "string" && topic.topic_category.trim()
      ? [topic.topic_category.trim()]
      : []),
    ...((Array.isArray(topic.related_topics) ? topic.related_topics : []).filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim())
    ).map((item) => item.trim())),
  ];

  return {
    market,
    marketKey,
    price,
    deltaText: delta.text,
    deltaColor: delta.color,
    asofText: asof,
    summaryItems,
    commentTitle,
    commentBodyHtml,
    commentBullets: commentBulletHtml,
    topics,
  };
}

function getAsOfText(topic: MarketInsightTopic): string {
  const asofRaw = topic.asof;
  if (typeof asofRaw === "string" && asofRaw.trim()) {
    return `${asofRaw.trim()} KST 기준`;
  }
  return `${nowKstString()} KST 기준`;
}

export function sortMarketInsights(byMarket: Record<string, MarketInsightTopic | undefined> | undefined): Array<[string, MarketInsightTopic]> {
  if (!byMarket) return [];

  const preferredOrder = ["KOSPI", "KOSDAQ", "NASDAQ", "S&P 500", "DOW", "NYSE", "AMEX"];
  const entries = Object.entries(byMarket).filter(([, value]) => value != null);
  const seen = new Set<string>();
  const ordered: Array<[string, MarketInsightTopic]> = [];

  for (const key of preferredOrder) {
    const match = entries.find(([market]) => market === key);
    if (match) {
      ordered.push(match as [string, MarketInsightTopic]);
      seen.add(key);
    }
  }

  for (const [key, value] of entries) {
    if (!seen.has(key)) ordered.push([key, value as MarketInsightTopic]);
  }

  return ordered;
}

export function buildMarketInsightCards(payload: MarketInsightPayload | null | undefined): MarketInsightCardData[] {
  if (!payload) return [];
  const ordered = sortMarketInsights(payload.by_market);
  const cards: MarketInsightCardData[] = [];

  for (const [marketKey, topic] of ordered) {
    try {
      const card = buildMarketInsightCard(topic, marketKey);
      if (card) cards.push(card);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("market insight build skip", error);
      }
    }
  }

  return cards;
}

export function buildMarketBadge(text: string, color: string = DEFAULT_BADGE_COLOR): string {
  return buildBadge(text, color);
}

export const marketInsightHelpers = {
  nowKstString,
  safeGet,
  formatCountCompact,
  formatInt,
  formatFloat,
  formatPct,
  formatWon,
  resolveChangeColor,
  ensureSentenceFormal,
  formatCommentHtml,
  buildSummaryItems,
  formatDelta,
  buildMarketInsightCard,
  buildMarketInsightCards,
  sortMarketInsights,
  buildBadge,
};

export type { MarketInsightPayload, MarketInsightTopic };
