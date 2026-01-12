const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type BriefingSlot =
  | "baseline"
  | "slot2"
  | "slot3"
  | "slot4"
  | "ranking"
  | "slot5";

interface SlotConfig {
  slot: BriefingSlot;
  startHour: number;
  startMinute: number;
  refreshCount: number | null;
  orderText: string;
}

const SLOT_SEQUENCE: SlotConfig[] = [
  {
    slot: "baseline",
    startHour: 7,
    startMinute: 30,
    refreshCount: null,
    orderText: "아침 베이스라인",
  },
  {
    slot: "slot2",
    startHour: 11,
    startMinute: 0,
    refreshCount: 1,
    orderText: "오늘 1번째 갱신",
  },
  {
    slot: "slot3",
    startHour: 14,
    startMinute: 30,
    refreshCount: 2,
    orderText: "오늘 2번째 갱신",
  },
  {
    slot: "slot4",
    startHour: 17,
    startMinute: 0,
    refreshCount: 3,
    orderText: "오늘 3번째 갱신",
  },
  {
    slot: "slot5",
    startHour: 21,
    startMinute: 0,
    refreshCount: null,
    orderText: "오늘 마지막 갱신 이후 유지",
  },
];

const MINUTES_IN_DAY = 24 * 60;

const padNumber = (value: number) => String(value).padStart(2, "0");

const minutesFromMidnight = (date: Date) =>
  date.getUTCHours() * 60 + date.getUTCMinutes();

const createUtcDateFromKstParts = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) => new Date(Date.UTC(year, month, day, hour - 9, minute, 0, 0));

const toKstDate = (date: Date) => new Date(date.getTime() + KST_OFFSET_MS);

const normaliseDateOnly = (date: Date) =>
  `${date.getUTCFullYear()}-${padNumber(date.getUTCMonth() + 1)}-${padNumber(
    date.getUTCDate()
  )}`;

export const formatDateKST = (date: Date) => {
  const kstDate = toKstDate(date);
  const y = kstDate.getUTCFullYear();
  const m = padNumber(kstDate.getUTCMonth() + 1);
  const d = padNumber(kstDate.getUTCDate());
  return `${y}-${m}-${d}`;
};

export interface RefreshMeta {
  slot: BriefingSlot;
  refreshCount: number | null;
  refreshOrderText: string;
  lastUpdatedAt: string;
}

export interface SlotLabel {
  phase: BriefingSlot;
  title: string;
  description: string;
}

const SLOT_LABEL_MAP: Record<BriefingSlot, Omit<SlotLabel, "phase">> = {
  baseline: {
    title: "프리 마켓 1차 브리핑",
    description: "07:30 장 시작 전 핵심 이슈",
  },
  slot2: {
    title: "오전 1차 브리핑",
    description: "11:00 장 중 핵심 업데이트",
  },
  slot3: {
    title: "오후 2차 브리핑",
    description: "14:30 점심 이후 체크",
  },
  slot4: {
    title: "장 마감 직전 브리핑",
    description: "17:00 마감 직전 흐름",
  },
  ranking: {
    title: "장 마감 리뷰 브리핑",
    description: "18:10 장 마감 핵심 복습",
  },
  slot5: {
    title: "저녁 리뷰 브리핑",
    description: "21:00 저녁 재랭킹 요약",
  },
};

const findActiveSlot = (date: Date) => {
  const kstDate = toKstDate(date);
  const minutes = minutesFromMidnight(kstDate);
  const firstSlotMinutes =
    SLOT_SEQUENCE[0].startHour * 60 + SLOT_SEQUENCE[0].startMinute;

  if (minutes < firstSlotMinutes) {
    return { config: SLOT_SEQUENCE[SLOT_SEQUENCE.length - 1], dayOffset: -1 };
  }

  let activeConfig = SLOT_SEQUENCE[0];
  for (const config of SLOT_SEQUENCE) {
    const configMinutes = config.startHour * 60 + config.startMinute;
    if (minutes >= configMinutes) {
      activeConfig = config;
    }
  }
  return { config: activeConfig, dayOffset: 0 };
};

const buildLastUpdatedDate = (
  source: Date,
  config: SlotConfig,
  dayOffset: number
) => {
  const kstDate = toKstDate(source);
  const slotDate = createUtcDateFromKstParts(
    kstDate.getUTCFullYear(),
    kstDate.getUTCMonth(),
    kstDate.getUTCDate(),
    config.startHour,
    config.startMinute
  );
  if (dayOffset === 0) {
    return slotDate;
  }
  return new Date(slotDate.getTime() + dayOffset * MINUTES_IN_DAY * 60 * 1000);
};

export const getBriefingSlot = (date: Date): BriefingSlot => {
  const { config } = findActiveSlot(date);
  return config.slot;
};

export const resolveStockSlot = (date: Date): number | null => {
  const slot = getBriefingSlot(date);
  if (slot === "baseline") return null;
  if (slot === "slot2") return 1;
  if (slot === "slot3") return 2;
  if (slot === "slot4") return 3;
  if (slot === "ranking") return 3; // ranking data uses 직전 슬롯 payload
  if (slot === "slot5") return 4;
  return null;
};

export const buildRefreshMeta = (date: Date): RefreshMeta => {
  const { config, dayOffset } = findActiveSlot(date);
  const lastUpdatedDate = buildLastUpdatedDate(date, config, dayOffset);
  return {
    slot: config.slot,
    refreshCount: config.refreshCount,
    refreshOrderText: config.orderText,
    lastUpdatedAt: lastUpdatedDate.toISOString(),
  };
};

export const formatLastUpdatedLabel = (
  lastUpdatedIso: string,
  now: Date = new Date()
) => {
  const targetDate = new Date(lastUpdatedIso);
  const targetKst = toKstDate(targetDate);
  const nowKst = toKstDate(now);
  const targetDay = normaliseDateOnly(targetKst);
  const nowDay = normaliseDateOnly(nowKst);
  const yesterday = new Date(nowKst.getTime() - MINUTES_IN_DAY * 60 * 1000);
  const yesterdayDay = normaliseDateOnly(yesterday);

  let prefix = `${targetKst.getUTCFullYear()}.${padNumber(
    targetKst.getUTCMonth() + 1
  )}.${padNumber(targetKst.getUTCDate())}`;
  if (targetDay === nowDay) {
    prefix = "오늘";
  } else if (targetDay === yesterdayDay) {
    prefix = "어제";
  }

  const hh = padNumber(targetKst.getUTCHours());
  const mm = padNumber(targetKst.getUTCMinutes());
  return `${prefix} ${hh}:${mm}`;
};

export const toKst = toKstDate;

export const getSlotLabelInfo = (slot: BriefingSlot): SlotLabel => {
  const base = SLOT_LABEL_MAP[slot] ?? SLOT_LABEL_MAP.baseline;
  return { phase: slot, ...base };
};
