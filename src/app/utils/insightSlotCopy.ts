import type { SlotLabel } from "@/utils/briefingSlot";
import type { BriefingSlot } from "@/utils/briefingSlot";

const BASE_LABELS: Record<BriefingSlot, SlotLabel> = {
  baseline: {
    phase: "baseline",
    title: "프리 마켓 브리핑",
    description: "07:30 장 시작 전 시나리오",
  },
  slot2: {
    phase: "slot2",
    title: "장초반 브리핑",
    description: "11:00 장 초반 핵심 업데이트",
  },
  slot3: {
    phase: "slot3",
    title: "오후 장중 브리핑",
    description: "14:30 오후 장중 핵심 업데이트",
  },
  slot4: {
    phase: "slot4",
    title: "장 마감 브리핑",
    description: "17:00 장 마감 브리핑",
  },
  slot5: {
    phase: "slot5",
    title: "저녁 리뷰 브리핑",
    description: "21:00 금일 장 리뷰",
  },
  ranking: {
    phase: "ranking",
    title: "장 마감 리뷰 브리핑",
    description: "18:10 장 마감 핵심 복습",
  },
};

const OVERSEAS_LABELS: Record<BriefingSlot, SlotLabel> = {
  baseline: {
    phase: "baseline",
    title: "간밤 미국장 1차 요약",
    description: "07:30 금일 미국장 1차 브리핑",
  },
  slot2: {
    phase: "slot2",
    title: "간밤 미국장 2차 요약",
    description: "11:00 금일 미국장 2차 브리핑",
  },
  slot3: {
    phase: "slot3",
    title: "오늘 밤 미국장 프리뷰 1차",
    description: "14:30 내일 미국장 프리뷰 1차 브리핑",
  },
  slot4: {
    phase: "slot4",
    title: "오늘 밤 미국장 프리뷰 2차",
    description: "17:00 내일 미국장 프리뷰 2차 브리핑",
  },
  slot5: {
    phase: "slot5",
    title: "미국 프리마켓 체크",
    description: "21:00 내일 미국장 프리마켓 동향",
  },
  ranking: {
    phase: "ranking",
    title: "미국장 프리뷰 업데이트",
    description: "18:10 프리뷰 리마인드",
  },
};

const CRYPTO_LABELS: Record<BriefingSlot, SlotLabel> = {
  baseline: {
    phase: "baseline",
    title: "새벽 코인 브리핑",
    description: "07:30 새벽/아침 코인 흐름 브리핑",
  },
  slot2: {
    phase: "slot2",
    title: "오전 코인 브리핑",
    description: "11:00 오전 코인 시황 브리핑",
  },
  slot3: {
    phase: "slot3",
    title: "점심·오후 브리핑",
    description: "14:30 점심 이후 코인 시황 반응 브리핑",
  },
  slot4: {
    phase: "slot4",
    title: "퇴근 직전 브리핑",
    description: "17:00 오후 코인 시황 변동성 브리핑",
  },
  slot5: {
    phase: "slot5",
    title: "저녁 브리핑",
    description: "21:00 밤 시간대 코인 시황 브리핑",
  },
  ranking: {
    phase: "ranking",
    title: "퇴근 후 브리핑",
    description: "18:10 퇴근 타임 요약",
  },
};

const resolveCategory = (label?: string) => {
  if (!label) return "domestic";
  if (label.includes("가상자산")) return "crypto";
  if (label.includes("해외 주식")) return "overseas";
  return "domestic";
};

export const resolveInsightSlotCopy = (
  sectionLabel: string,
  slotLabel?: SlotLabel
): SlotLabel | undefined => {
  if (!slotLabel) return undefined;
  const category = resolveCategory(sectionLabel);
  if (category === "crypto") return CRYPTO_LABELS[slotLabel.phase];
  if (category === "overseas") return OVERSEAS_LABELS[slotLabel.phase];
  return BASE_LABELS[slotLabel.phase];
};
