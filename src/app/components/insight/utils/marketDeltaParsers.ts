import type { InsightMarketDeltaCard } from "@/types/insight";

export type LiquidityTone = "up" | "down" | "flat";

export interface MarketLiquidityDetail {
  text: string;
  summaryHtml: string;
  volumeRatio: number;
  volumeRatioText: string;
  volumeSummary?: string;
  volumeLeft: number;
  volumeWidth: number;
  volumePointer: number;
  volumeTone: LiquidityTone;
  valueRatio: number;
  valueRatioText: string;
  valueSummary?: string;
  valueLeft: number;
  valueWidth: number;
  valuePointer: number;
  valueTone: LiquidityTone;
}

export interface MarketIntradayDetail {
  open: number;
  high: number;
  low: number;
  close: number;
  openPct: number;
  highPct: number;
  lowPct: number;
  closePct: number;
  text: string;
}

export interface MarketFlowShareSegment {
  key: string;
  label: string;
  percent: number;
  tone: "foreign" | "institution" | "individual" | "others";
}

export interface MarketFlowShareDetail {
  segments: MarketFlowShareSegment[];
}

export interface MarketFlowShiftItem {
  key: "foreign" | "institution" | "individual";
  label: string;
  todayQty: number;
  prevQty: number;
  todayAmount: number;
  prevAmount: number;
}

export interface MarketFlowShiftDetail {
  items: MarketFlowShiftItem[];
}

const DEFAULT_FLOW_MONETARY_UNIT = 1_000_000;

export function buildLiquidityDetailFromSentence(
  card: Pick<InsightMarketDeltaCard, "sentences"> & {
    volume_value_str?: string | null;
  }
): MarketLiquidityDetail | null {
  const rawTextCandidate = [
    card.sentences?.liquidity_change,
    card.volume_value_str,
  ].find((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (!rawTextCandidate) return null;

  const normalized = rawTextCandidate
    .replace(/<br\s*\/?\>/gi, " ")
    .replace(/\s+/g, " ");

  const volumeMatch = normalized.match(
    /거래량[^0-9]*([\d,]+)\s*주?\s*\(전일\s*([\d,]+)\s*주?(?:[^0-9]+([\d.]+)x)?/i
  );
  const valueMatch = normalized.match(
    /거래대금[^0-9]*([\d,]+)(억)?\s*원?\s*\(전일\s*([\d,]+)(억)?\s*원?(?:[^0-9]+([\d.]+)x)?/i
  );
  const volumeSummaryMatch = normalized.match(
    /거래량은[^,]*?([가-힣A-Za-z\s]+?)\s*\(/
  );
  const valueSummaryMatch = normalized.match(
    /거래대금은[^,]*?([가-힣A-Za-z\s]+?)\s*\(/
  );

  if (!volumeMatch || !valueMatch) {
    return null;
  }

  const volumeCurrent = parseNumber(volumeMatch[1]) ?? 0;
  const volumePrevious = parseNumber(volumeMatch[2]) ?? 0;
  const volumeRatioFromText = volumeMatch[3]
    ? parseFloat(volumeMatch[3])
    : null;

  const valueCurrentRaw = parseNumber(valueMatch[1]) ?? 0;
  const valuePreviousRaw = parseNumber(valueMatch[3]) ?? 0;
  const valueCurrentUnit = valueMatch[2];
  const valuePreviousUnit = valueMatch[4];
  const valueRatioFromText = valueMatch[5] ? parseFloat(valueMatch[5]) : null;

  const valueCurrent =
    parseAmountWithUnit(String(valueMatch[1]), valueCurrentUnit, DEFAULT_FLOW_MONETARY_UNIT) ??
    valueCurrentRaw;
  const valuePrevious =
    parseAmountWithUnit(String(valueMatch[3]), valuePreviousUnit, DEFAULT_FLOW_MONETARY_UNIT) ??
    valuePreviousRaw;

  const volumeRatio =
    volumeRatioFromText && Number.isFinite(volumeRatioFromText)
      ? volumeRatioFromText
      : volumePrevious > 0
      ? volumeCurrent / volumePrevious
      : 1;

  const valueRatio =
    valueRatioFromText && Number.isFinite(valueRatioFromText)
      ? valueRatioFromText
      : valuePrevious > 0
      ? valueCurrent / valuePrevious
      : 1;

  const volumeData = computeLiquidityPosition(volumeRatio);
  const valueData = computeLiquidityPosition(valueRatio);

  const volumeLabelRaw = volumeSummaryMatch?.[1]?.trim();
  const valueLabelRaw = valueSummaryMatch?.[1]?.trim();

  const volumeRatioText = volumeRatioFromText
    ? `${volumeRatioFromText}x`
    : `${volumeRatio.toFixed(2)}x`;
  const valueRatioText = valueRatioFromText
    ? `${valueRatioFromText}x`
    : `${valueRatio.toFixed(2)}x`;

  const valueCurrentText = formatLiquidityCurrency(
    valueCurrent,
    valueCurrentRaw,
    valueCurrentUnit
  );
  const valuePreviousText = formatLiquidityCurrency(
    valuePrevious,
    valuePreviousRaw,
    valuePreviousUnit
  );

  const summaryHtml = `거래량 ${formatNumberCompact(
    volumeCurrent
  )} (전전일 ${formatNumberCompact(
    volumePrevious
  )}) · 거래대금 ${valueCurrentText} (전전일 ${valuePreviousText})`;

  const volumeSummary = volumeLabelRaw
    ? `${volumeLabelRaw}`
    : `거래량 ${describeLiquidityChange(volumeRatio)} (${volumeRatioText})`;
  const valueSummary = `전전일 대비 거래대금 ${describeLiquidityChange(
    valueRatio
  )}`;

  return {
    text: rawTextCandidate,
    summaryHtml,
    volumeRatio,
    volumeRatioText,
    volumeSummary,
    volumeLeft: volumeData.left,
    volumeWidth: volumeData.width,
    volumePointer: volumeData.pointer,
    volumeTone: volumeData.tone,
    valueRatio,
    valueRatioText,
    valueSummary,
    valueLeft: valueData.left,
    valueWidth: valueData.width,
    valuePointer: valueData.pointer,
    valueTone: valueData.tone,
  };
}

export function buildIntradayDetailFromCard(
  card: InsightMarketDeltaCard
): MarketIntradayDetail | null {
  const sentence = card.sentences?.price_intraday;
  if (typeof sentence !== "string" || sentence.trim().length === 0) {
    return null;
  }

  const open = extractPrice(sentence, /시가\s*([\d.,]+)/);
  const high = extractPrice(sentence, /고가\s*([\d.,]+)/);
  const low = extractPrice(sentence, /저가\s*([\d.,]+)/);

  if (open == null || high == null || low == null) {
    return null;
  }

  const spread = high - low;
  if (!Number.isFinite(spread) || spread <= 0) {
    return null;
  }

  const close = parseNumberFromText(card.price_str) ?? high;
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  const position = (value: number) => ((value - low) / spread) * 100;

  const text = `장중 범위 ${low.toLocaleString()}~${high.toLocaleString()} · 시가 ${open.toLocaleString()} · 종가 ${close.toLocaleString()}`;

  return {
    open,
    high,
    low,
    close,
    lowPct: 0,
    highPct: 100,
    openPct: clamp(position(open)),
    closePct: clamp(position(close)),
    text,
  };
}

export function buildFlowShareDetail(
  card: InsightMarketDeltaCard
): MarketFlowShareDetail | null {
  const segments = card.flows?.segments;
  if (!segments || segments.length === 0) {
    return null;
  }

  const mapped: MarketFlowShareSegment[] = [];

  segments.forEach((segment) => {
    if (!segment) return;
    const normalizedKey = normalizeFlowKey(segment.key || segment.label);
    if (!normalizedKey) return;

    const label = segment.label || flowLabelFromKey(normalizedKey);
    const percentRaw = selectNumeric(segment.ratio, segment.value);
    if (percentRaw == null) return;

    let percentValue = Math.abs(percentRaw);
    if (!Number.isFinite(percentValue)) return;
    if (percentValue <= 1) {
      percentValue *= 100;
    }

    const percent = Math.max(0, Math.min(100, Number(percentValue.toFixed(1))));
    mapped.push({ key: normalizedKey, label, percent, tone: normalizedKey });
  });

  if (mapped.length === 0) {
    return null;
  }

  const total = mapped.reduce((sum, item) => sum + item.percent, 0);
  if (total < 99.5) {
    const remainder = Math.max(0, Number((100 - total).toFixed(1)));
    if (remainder > 0.1) {
      mapped.push({
        key: "others",
        label: "기타",
        percent: remainder,
        tone: "others",
      });
    }
  }

  return { segments: mapped };
}

export function buildFlowShiftDetail(
  card: InsightMarketDeltaCard
): MarketFlowShiftDetail | null {
  const items: MarketFlowShiftItem[] = [];
  const candidates: Array<{
    key: MarketFlowShiftItem["key"];
    label: string;
    text?: string | null;
  }> = [
    { key: "foreign", label: "외국인", text: card.sentences?.flow_shift_foreign },
    {
      key: "institution",
      label: "기관",
      text: card.sentences?.flow_shift_institution,
    },
    {
      key: "individual",
      label: "개인",
      text: card.sentences?.flow_shift_individual,
    },
  ];

  candidates.forEach((candidate) => {
    const parsed = parseFlowShiftSentence(candidate.text, candidate.key, candidate.label);
    if (parsed) {
      items.push(parsed);
    }
  });

  if (items.length === 0) {
    return null;
  }

  return { items };
}

function computeLiquidityPosition(ratio: number) {
  const capHigh = 2;
  const capLow = 0;
  const base = 50;
  const r = Math.min(Math.max(ratio, capLow), capHigh);
  const maxAbove = capHigh - 1;
  const maxBelow = 1 - capLow;

  let left = base;
  let width = 0;

  if (r >= 1) {
    const diff = r - 1;
    width = maxAbove ? (diff / maxAbove) * 50 : 0;
  } else {
    const diff = 1 - r;
    width = maxBelow ? (diff / maxBelow) * 50 : 0;
    left = base - width;
  }

  const pointer = ((r - capLow) / (capHigh - capLow)) * 100;
  const changePct = (ratio - 1) * 100;
  const tone: LiquidityTone =
    changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";

  return {
    left,
    width,
    pointer: Math.min(Math.max(pointer, 0), 100),
    tone,
  };
}

function describeLiquidityChange(ratio: number) {
  if (!Number.isFinite(ratio)) return "보통";

  const THRESHOLD = 0.05;
  if (ratio >= 1 + THRESHOLD) {
    return "상승";
  }
  if (ratio <= 1 - THRESHOLD) {
    return "위축";
  }
  return "보통";
}

function formatLiquidityCurrency(
  valueInWon: number,
  rawValue: number,
  unit?: string | null
) {
  if (unit === "억") {
    if (rawValue >= 1_000_000) {
      const adjusted = rawValue / 1_000_000;
      return `${formatNumberWithPrecision(adjusted)}조원`;
    }

    const inJo = rawValue / 10_000;
    if (inJo >= 1) {
      return `${formatNumberWithPrecision(inJo)}조원`;
    }
  }

  return formatCurrencyCompact(valueInWon);
}

function parseNumber(value?: string | null) {
  if (!value) return null;
  const numeric = Number(value.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseSignedNumber(value?: string | null, direction?: string) {
  const numeric = parseNumber(value);
  if (numeric == null) return null;
  return applyDirectionSign(numeric, direction);
}

function extractPrice(sentence: string, pattern: RegExp) {
  const match = pattern.exec(sentence);
  if (!match || !match[1]) return null;
  return parseNumber(match[1]);
}

function formatNumberCompact(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(2)}억`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 10_000).toFixed(2)}만`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

function formatCurrencyCompact(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(2)}조원`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(2)}억원`;
  }
  if (abs >= 10_000_000) {
    return `${sign}${(abs / 10_000_000).toFixed(2)}천만원`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}백만원`;
  }
  return `${sign}${abs.toLocaleString()}원`;
}

function parseNumberFromText(value?: string | null) {
  if (!value) return null;
  const numeric = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function formatNumberWithPrecision(value: number, maximumFractionDigits = 2) {
  if (maximumFractionDigits <= 0) {
    return Math.trunc(value).toLocaleString();
  }

  const factor = 10 ** maximumFractionDigits;
  const floored = Math.trunc(value * factor) / factor;

  return floored.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function normalizeFlowKey(value?: string | null): MarketFlowShareSegment["tone"] | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes("foreign") || normalized.includes("외국")) {
    return "foreign";
  }
  if (normalized.includes("institution") || normalized.includes("기관")) {
    return "institution";
  }
  if (
    normalized.includes("individual") ||
    normalized.includes("personal") ||
    normalized.includes("retail") ||
    normalized.includes("개인")
  ) {
    return "individual";
  }
  if (normalized.includes("기타") || normalized.includes("others")) {
    return "others";
  }
  return undefined;
}

function flowLabelFromKey(key: MarketFlowShareSegment["tone"]): string {
  switch (key) {
    case "foreign":
      return "외국인";
    case "institution":
      return "기관";
    case "individual":
      return "개인";
    default:
      return "기타";
  }
}

function selectNumeric(
  ...values: Array<string | number | null | undefined>
): number | null {
  for (const value of values) {
    const numeric = toNumeric(value);
    if (numeric != null) {
      return numeric;
    }
  }
  return null;
}

function parseFlowShiftSentence(
  sentence: string | null | undefined,
  key: MarketFlowShiftItem["key"],
  label: string
): MarketFlowShiftItem | null {
  if (!sentence) return null;
  const normalized = sentence
    .replace(/<br\s*\/?\>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const pattern =
    /(외국인|기관|개인)\s+(순매수|순매도)[:：]?\s*오늘\s*수량\s*([-+\d,]+)주,\s*오늘\s*금액\s*([-+\d,.]+)(?:\s*([가-힣A-Za-z]+))?\s*(?:원|KRW)?\s*\(\s*전일\s*(?:(순매수|순매도)[:：]?\s*)?전일\s*수량\s*([-+\d,]+)주,\s*전일\s*금액\s*([-+\d,.]+)(?:\s*([가-힣A-Za-z]+))?\s*(?:원|KRW)?\s*\)/i;
  const match = pattern.exec(normalized);
  if (!match) {
    return null;
  }

  const [
    ,
    labelRaw,
    direction,
    todayQtyRaw,
    todayAmtRaw,
    todayAmtUnit,
    prevDirection,
    prevQtyRaw,
    prevAmtRaw,
    prevAmtUnit,
  ] = match;

  const todayQty = parseSignedNumber(todayQtyRaw, direction) ?? 0;
  const prevQty = parseSignedNumber(prevQtyRaw, prevDirection) ?? 0;
  const todayAmount =
    parseSignedAmount(todayAmtRaw, todayAmtUnit, direction) ?? 0;
  const prevAmount =
    parseSignedAmount(prevAmtRaw, prevAmtUnit, prevDirection) ?? 0;

  return {
    key,
    label,
    todayQty,
    prevQty,
    todayAmount,
    prevAmount,
  };
}

function parseAmountWithUnit(
  value?: string | null,
  unit?: string | null,
  fallbackMultiplier = 1
) {
  const numeric = parseNumber(value);
  if (numeric == null) return null;
  return applyUnitMultiplier(numeric, unit, fallbackMultiplier);
}

function parseSignedAmount(
  value?: string | null,
  unit?: string | null,
  direction?: string,
  fallbackMultiplier = DEFAULT_FLOW_MONETARY_UNIT
) {
  const base = parseAmountWithUnit(value, unit, fallbackMultiplier);
  if (base == null) return null;
  return applyDirectionSign(base, direction);
}

function applyDirectionSign(value: number, direction?: string) {
  if (!direction) return value;
  if (value === 0) return 0;
  const isSell = /순매도/.test(direction);
  const isBuy = /순매수/.test(direction);
  if (!isSell && !isBuy) {
    return value;
  }
  if (isSell && value > 0) {
    return -value;
  }
  if (isBuy && value < 0) {
    return -value;
  }
  return value;
}

function toNumeric(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "").trim();
    if (cleaned.length === 0) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function applyUnitMultiplier(
  value: number,
  unit?: string | null,
  fallbackMultiplier = 1
) {
  if (!Number.isFinite(value)) return value;
  if (!unit || unit.trim().length === 0) {
    return value * fallbackMultiplier;
  }

  const normalized = unit.trim();
  if (/조/.test(normalized)) {
    return value * 1_000_000_000_000;
  }
  if (/억/.test(normalized)) {
    return value * 100_000_000;
  }
  if (/천만/.test(normalized)) {
    return value * 10_000_000;
  }
  if (/백만/.test(normalized) || /million/i.test(normalized)) {
    return value * 1_000_000;
  }
  if (/십만/.test(normalized)) {
    return value * 100_000;
  }
  if (/만/.test(normalized)) {
    return value * 10_000;
  }
  if (/원|krw/i.test(normalized)) {
    return value;
  }
  return value * fallbackMultiplier;
}
