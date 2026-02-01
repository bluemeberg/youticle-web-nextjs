"use client";

import React from "react";

// 구독자 수를 파싱하는 함수
export const parseSubscribersCount = (count: number): string => {
  if (count < 1000) {
    return `${count}명`;
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(2).replace(/\.?0+$/, "")}천명`;
  } else if (count < 100000000) {
    if (count >= 1000000) {
      return `${Math.floor(count / 10000)}만명`;
    }
    return `${(count / 10000).toFixed(2).replace(/\.?0+$/, "")}만명`;
  } else {
    return `${(count / 100000000).toFixed(1).replace(/\.?0+$/, "")}억명`;
  }
};

// Converts "HH:MM:SS" or "MM:SS" → total seconds
export function parseTimeStringToSeconds(
  tsInput: string | number | null | undefined
): number {
  if (tsInput === null || tsInput === undefined) {
    return 0;
  }

  const ts = typeof tsInput === "string" ? tsInput : String(tsInput);

  // 1) colon-delimited → HH:MM:SS or MM:SS
  if (ts.includes(":")) {
    const parts = ts.split(":").map((p) => Number(p) || 0);
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return h * 3600 + m * 60 + s;
    }
    if (parts.length === 2) {
      const [m, s] = parts;
      return m * 60 + s;
    }
  }

  // 2) otherwise treat as seconds (possibly with decimal)
  const secs = parseFloat(ts);
  return isNaN(secs) ? 0 : Math.floor(secs);
}

// 구독자 수를 파싱하는 함수
export const parseVideoCountcribersCount = (count: number): string => {
  if (count < 1000) {
    return `${count}`;
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(2).replace(/\.?0+$/, "")}천`;
  } else if (count < 100000000) {
    if (count >= 1000000) {
      return `${Math.floor(count / 10000)}만`;
    }
    return `${(count / 10000).toFixed(2).replace(/\.?0+$/, "")}만`;
  } else {
    return `${(count / 100000000).toFixed(1).replace(/\.?0+$/, "")}억`;
  }
};

// 시간을 두 자리 숫자로 포맷팅하는 함수
const formatToTwoDigits = (time: number): string =>
  time.toString().padStart(2, "0");

// 남은 시간을 계산하는 함수
export const calcuateTimeLeft = (): string => {
  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    2,
    30,
    0
  );
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${formatToTwoDigits(hours)}:${formatToTwoDigits(
    minutes
  )}:${formatToTwoDigits(seconds)}`;
};

// 분을 시간 포맷으로 변환하는 함수
export const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = remainingMinutes.toString().padStart(2, "0");
  return `${formattedHours}:${formattedMinutes}`;
};

export function formatSecondsToMmSs(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

// 시간 범위를 포맷팅하는 함수
export const formatTimeRange = (startMinutes: number): string => {
  const startTime = formatMinutesToTime(startMinutes);
  return `${startTime}~`;
};

export const formatSummary = (summary: string | string[] | undefined) => {
  // summary가 undefined일 경우 기본 메시지 반환
  if (!summary) {
    return <span className="line-break">내용이 없습니다.</span>;
  }

  // summary가 배열일 경우 첫 번째 값을 사용
  const summaryText = Array.isArray(summary) ? summary[0] : summary;

  // 정규식 패턴에 맞는 부분이 없을 경우 처리
  try {
    const regex = /(?<!\d\.\d)\. /g;

    const sentences = summaryText.split(regex);

    return sentences.length > 0
      ? sentences
          .filter((sentence) => sentence.trim() !== "")
          .map((sentence, index, array) => {
            const parts = sentence
              .split(
                /(<mark>.*?<\/mark>|<mark[^>]*?>.*?<\/mark[^>]*?>|<\/?mark[^>]*>)/g
              ) // 잘못된 <mark> 필터링
              .map((part, i) => {
                // 올바른 <mark> 태그만 처리
                if (part.startsWith("<mark>") && part.endsWith("</mark>")) {
                  return (
                    <b style={{ fontWeight: "bold" }} key={i}>
                      {part.replace(/<\/?mark>/g, "")}
                    </b>
                  );
                }

                // 잘못된 <mark> 태그 제거
                if (/<mark[^>]*?>|<\/?mark[^>]*>/.test(part)) {
                  // 잘못된 태그만 제거하고 텍스트를 반환
                  return part.replace(/<\/?mark[^>]*>/g, "");
                }

                // 일반 텍스트 처리
                return part;
              });

            return (
              <span key={index} className="line-break">
                {parts}
                {index !== array.length - 1 ? "." : ""}
              </span>
            );
          })
      : summaryText; // 정규식이 적용되지 않았을 경우 텍스트 그대로 반환
  } catch (error) {
    console.error("Error processing summary:", error);
    return <span className="line-break">{summaryText}</span>;
  }
};

export const timeSinceUpload = (uploadTime: string) => {
  // 현재 시각 가져오기
  const now = new Date();

  // 업로드 시간 파싱 (ISO 형식)
  const uploadDate = new Date(uploadTime);

  // 시간 차이 계산 (밀리초 단위)
  const timeDifference = now.getTime() - uploadDate.getTime();

  // 밀리초를 시간 단위로 변환
  const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));

  // 24시간 이상이면 일 단위로, 아니면 시간 단위로 출력
  if (hoursDifference >= 24) {
    const daysDifference = Math.floor(hoursDifference / 24);
    return `${daysDifference}일 전`;
  } else {
    return `${hoursDifference}시간 전`;
  }
};

export const removeMarkTags = (text: string): string => {
  if (!text) return "";
  // 정규식을 사용하여 <mark></mark> 태그를 삭제
  return text.replace(/<mark[^>]*>/g, "").replace(/<\/mark>/g, "");
};

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const dateObj = new Date(dateStr);

  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return `${diffSecs}초 전`;
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}주 전`; // 7일 이상은 주 단위
  } else {
    const diffMonths =
      (now.getFullYear() - dateObj.getFullYear()) * 12 +
      (now.getMonth() - dateObj.getMonth());
    const diffYears = now.getFullYear() - dateObj.getFullYear();

    if (diffYears >= 1) {
      return `${diffYears}년 전`;
    } else {
      return `${diffMonths}개월 전`;
    }
  }
}

// UUID 생성/저장 예시
export function getOrCreateAnonId(): string {
  let anon = localStorage.getItem("anon_uuid");
  if (!anon) {
    anon = crypto.randomUUID();
    localStorage.setItem("anon_uuid", anon);
  }
  return anon;
}

export function timeAgoUTC(dateStr: string): string {
  let normalized = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    normalized = normalized.replace(" ", "T");
  }
  const iso = /Z$|[+\-]\d\d:\d\d$/.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const dateObj = new Date(iso);

  // 2) now도 로컬(KST) Date 객체—두 시점이 동일한 기준(UTC)으로 비교됨
  const now = new Date();

  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1_000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return `${diffSecs}초 전`;
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}주 전`;
  } else {
    const months =
      (now.getFullYear() - dateObj.getFullYear()) * 12 +
      (now.getMonth() - dateObj.getMonth());
    const years = now.getFullYear() - dateObj.getFullYear();
    return years >= 1 ? `${years}년 전` : `${months}개월 전`;
  }
}
