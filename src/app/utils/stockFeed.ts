import type { DataProps, StockFeedSlotPhase } from "@/types/dataProps";

export type StockSlotPhase = StockFeedSlotPhase;

export interface StockSlotRequest {
  slot: StockSlotPhase;
  url: string;
  priority: number;
}

export interface StockSlotPayload extends StockSlotRequest {
  data: DataProps[];
}

const STOCK_SLOT_LABELS: Record<StockSlotPhase, { label: string; description: string }> = {
  baseline: { label: "07:30 베이스라인", description: "야간 반응을 모아둔 첫 선정" },
  slot2: { label: "11:00 1차 갱신", description: "오전 장 흐름·수급 확인" },
  slot3: { label: "14:30 2차 갱신", description: "점심 이후 변동성 체크" },
  slot4: { label: "17:00 3차 갱신", description: "장 마감 직전 핵심 정리" },
  slot5: { label: "21:00 마지막 갱신", description: "저녁 재랭킹·복습" },
};

const SLOT_REQUEST_SEQUENCE: Array<{ phase: StockSlotPhase; timeSlot: number }> = [
  { phase: "slot2", timeSlot: 2 },
  { phase: "slot3", timeSlot: 3 },
  { phase: "slot4", timeSlot: 4 },
  { phase: "slot5", timeSlot: 5 },
];

const MAX_STOCK_SLOT = SLOT_REQUEST_SEQUENCE.length;

export interface StockSlotSection {
  slot: StockSlotPhase;
  priority: number;
  label: string;
  description: string;
  items: DataProps[];
}

export const buildStockSlotRequests = ({
  currentSlot,
  baselineUrl,
  v2BaseUrl,
}: {
  currentSlot: number | null;
  baselineUrl: string;
  v2BaseUrl: string;
}): StockSlotRequest[] => {
  const requests: StockSlotRequest[] = [
    { slot: "baseline", url: baselineUrl, priority: 0 },
  ];

  const slotCount = Math.max(0, Math.min(MAX_STOCK_SLOT, currentSlot ?? 0));
  for (let index = 0; index < slotCount; index += 1) {
    const config = SLOT_REQUEST_SEQUENCE[index];
    requests.push({
      slot: config.phase,
      url: `${v2BaseUrl}?time_slot=${config.timeSlot}`,
      priority: index + 1,
    });
  }

  return requests;
};

const annotatePayloads = (payloads: StockSlotPayload[]): StockSlotPayload[] =>
  payloads.map((payload) => ({
    ...payload,
    data: payload.data.map((item) => ({
      ...item,
      stock_slot_phase: payload.slot,
      stock_slot_priority: payload.priority,
    })),
  }));

export const mergeStockSlotPayloads = (payloads: StockSlotPayload[]): DataProps[] => {
  if (payloads.length === 0) return [];
  const annotated = annotatePayloads(payloads);
  return annotated
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .flatMap((entry) => entry.data ?? []);
};

export const buildStockSlotSections = (
  payloads: StockSlotPayload[]
): StockSlotSection[] => {
  if (payloads.length === 0) return [];
  const annotated = annotatePayloads(payloads);
  return annotated
    .filter((payload) => payload.data.length > 0)
    .map((payload) => {
      const meta = STOCK_SLOT_LABELS[payload.slot];
      return {
        slot: payload.slot,
        priority: payload.priority,
        label: meta.label,
        description: meta.description,
        items: payload.data,
      };
    })
    .sort((a, b) => a.priority - b.priority);
};
