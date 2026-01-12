import type { SlotLabel } from "@/utils/briefingSlot";
import type { BriefingSlot } from "@/utils/briefingSlot";

const BASE_LABELS: Record<BriefingSlot, SlotLabel> = {
  baseline: {
    phase: "baseline",
    title: "프리 마켓 1차 브리핑",
    description: "07:30 장 시작 전 베이스라인",
  },
  slot2: {
    phase: "slot2",
    title: "오전 1차 브리핑",
    description: "11:00 장 중 핵심 업데이트",
  },
  slot3: {
    phase: "slot3",
    title: "오후 2차 브리핑",
    description: "14:30 점심 이후 점검",
  },
  slot4: {
    phase: "slot4",
    title: "장 마감 직전 브리핑",
    description: "17:00 마감 직전 체크",
  },
  slot5: {
    phase: "slot5",
    title: "저녁 리뷰 브리핑",
    description: "21:00 저녁 재랭킹",
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
    description: "07:30 미국장 핵심 요약",
  },
  slot2: {
    phase: "slot2",
    title: "미국장 오전 리마인드",
    description: "11:00 간밤 후속 업데이트",
  },
  slot3: {
    phase: "slot3",
    title: "오늘 밤 미국장 프리뷰 1차",
    description: "14:30 오늘 밤 주목 포인트",
  },
  slot4: {
    phase: "slot4",
    title: "오늘 밤 미국장 프리뷰 2차",
    description: "17:00 마감 전 리마인드",
  },
  slot5: {
    phase: "slot5",
    title: "미국 프리마켓 체크",
    description: "21:00 프리마켓 동향",
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
    title: "새벽·아침 코인 브리핑 1차",
    description: "07:30 새벽/아침 흐름",
  },
  slot2: {
    phase: "slot2",
    title: "오전 코인 브리핑",
    description: "11:00 오전 급등락 체크",
  },
  slot3: {
    phase: "slot3",
    title: "점심·오후 브리핑",
    description: "14:30 점심 이후 반응",
  },
  slot4: {
    phase: "slot4",
    title: "퇴근 직전 브리핑",
    description: "17:00 오후 변동성 요약",
  },
  slot5: {
    phase: "slot5",
    title: "심야 브리핑",
    description: "21:00 밤 시간대 미국장 반응",
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
