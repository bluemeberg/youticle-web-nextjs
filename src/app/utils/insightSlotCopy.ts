import type { SlotLabel } from "@/utils/briefingSlot";
import type { BriefingSlot } from "@/utils/briefingSlot";

const BASE_LABELS: Record<BriefingSlot, SlotLabel> = {
  baseline: {
    phase: "baseline",
    title: "프리 마켓 브리핑",
    description: "아침 7:30 스냅 샷 기준, 국내 주식 장 시작 전 전일 시장 리뷰",
  },
  slot2: {
    phase: "slot2",
    title: "장초반 브리핑",
    description: "오전 11:00 스냅 샷 기준, 장 초반 핵심 내용 업데이트",
  },
  slot3: {
    phase: "slot3",
    title: "오후 장중 브리핑",
    description: "오후 2:30 스냅 샷 기준, 오후 장중 핵심 내용 업데이트",
  },
  slot4: {
    phase: "slot4",
    title: "장 마감 브리핑",
    description: "오후 5:00 스냅 샷 기준, 장 마감 브리핑",
  },
  slot5: {
    phase: "slot5",
    title: "저녁 리뷰 브리핑",
    description: "저녁 9:00 스냅 샷 기준, 금일 장 리뷰",
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
    description: "아침 7:30 스냅 샷 기준, 금일 미국장 1차 브리핑",
  },
  slot2: {
    phase: "slot2",
    title: "간밤 미국장 2차 요약",
    description: "오전 11:00 스냅 샷 기준, 금일 미국장 2차 브리핑",
  },
  slot3: {
    phase: "slot3",
    title: "오늘 밤 미국장 프리뷰 1차",
    description: "오후 2:30 스냅 샷 기준, 오늘 밤 미국장 프리뷰 1차 브리핑",
  },
  slot4: {
    phase: "slot4",
    title: "오늘 밤 미국장 프리뷰 2차",
    description: "오후 5:00 스냅 샷 기준, 오늘 밤 미국장 프리뷰 2차 브리핑",
  },
  slot5: {
    phase: "slot5",
    title: "미국 프리마켓 체크",
    description: "저녁 9:00 스냅 샷 기준, 곧 있을 미국장 프리마켓 동향",
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
    description: "아침 7:30 스냅 샷 기준, 새벽 코인 흐름 브리핑",
  },
  slot2: {
    phase: "slot2",
    title: "오전 코인 브리핑",
    description: "오전 11:00 스냅 샷 기준, 오전 코인 시황 브리핑",
  },
  slot3: {
    phase: "slot3",
    title: "점심/오후 브리핑",
    description: "오후 2:30 스냅 샷 기준, 점심 이후 코인 시황 반응 브리핑",
  },
  slot4: {
    phase: "slot4",
    title: "퇴근 직전 브리핑",
    description: "오후 5:00 스냅 샷 기준, 오후 코인 시황 변동성 브리핑",
  },
  slot5: {
    phase: "slot5",
    title: "저녁 브리핑",
    description: "저녁 9:00 스냅 샷 기준, 밤 시간대 코인 시황 브리핑",
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
