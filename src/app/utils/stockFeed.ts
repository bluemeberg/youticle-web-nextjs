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

const MAX_STOCK_SLOT = 4;

const STOCK_SLOT_LABELS: Record<StockSlotPhase, { label: string; description: string }> = {
  baseline: { label: "07:30 베이스라인", description: "야간 반응을 모아둔 첫 선정" },
  slot1: { label: "08:30 1차 갱신", description: "장 시작 직후 갱신" },
  slot2: { label: "12:40 2차 갱신", description: "점심 휴장 시간 집중 모니터링" },
  slot3: { label: "15:10 3차 갱신", description: "오후 장 마감 직전 체크" },
  slot4: { label: "21:40 마감", description: "장 마감 이후 저녁 재랭킹" },
};

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
  for (let slot = 1; slot <= slotCount; slot += 1) {
    requests.push({
      slot: `slot${slot}` as `slot${1 | 2 | 3 | 4}`,
      url: `${v2BaseUrl}?time_slot=${slot}`,
      priority: slot,
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
