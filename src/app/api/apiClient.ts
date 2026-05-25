// apiClient.ts

import { ChannelDetails } from "@/types/dataProps";

const API_BASE_URL = "https://youticle.shop";
// 유저 정보 최초 등록
const API_STAGE_BASE_URL = "http://0.0.0.0:8001";

export const createOrFetchUser = async (email: string, name: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
    throw error;
  }
};

// 유저 정보 가져오기
export const getUserByEmail = async (
  email: string | null,
  name: string | null,
): Promise<{ id: number; phone: string | null }> => {
  const safeEmail = email ?? "";
  const safeName = name ?? "익명 사용자";

  const url = `${API_BASE_URL}/users/${encodeURIComponent(safeEmail)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("User data:", data);
      return data;
    } else if (response.status === 404) {
      console.error("User not found. Creating new user...");
      const newUser = await createOrFetchUser(safeEmail, safeName);
      console.log("New user created:", newUser);
      return newUser;
    } else {
      console.error(`Error: ${response.status}, ${response.statusText}`);
      throw new Error(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

// 구독 주제 가져오는 API
export const fetchSubscribedSubjects = async (
  email: string,
  name: string,
): Promise<string[]> => {
  try {
    // user_id 정보 가져오기
    const userData = await getUserByEmail(email, name);
    const response = await fetch(
      `${API_BASE_URL}/users/subjects/${userData.id}`,
    );
    if (response.ok) {
      const data = await response.json();
      const subjectNames = data.map(
        (item: { subject_name: string }) => item.subject_name,
      );
      return subjectNames;
    } else {
      console.error("Failed to fetch subscribed subjects");
      return [];
    }
  } catch (error) {
    console.error("Error fetching subscribed subjects:", error);
    return [];
  }
};

export const updateUserSubject = async (
  userId: number,
  oldSubjectName: string,
  newSubjectName: string,
) => {
  const url = `${API_BASE_URL}/users/subject/?user_id=${userId}&old_subject_name=${encodeURIComponent(
    oldSubjectName,
  )}&new_subject_name=${encodeURIComponent(newSubjectName)}`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update subject: ${errorText}`);
    }

    const data = await response.json();
    console.log("Subject updated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error updating subject:", error);
    throw error;
  }
};

// v7 키워드 이전 — 분류 미리보기 + 일괄 교체
export interface KeywordMigrationPreview {
  user_id: number;
  email: string;
  current_subjects: string[];
  kept: string[];
  renamed: { from: string; to: string[] }[];
  dropped: string[];
  auto_selected: string[];
  supported: string[];
  user_state: "all_kept" | "has_renamed" | "partial_dropped" | "all_dropped";
}

/**
 * 키워드 이전 — 운영 기존 엔드포인트(PUT /users/subject/, POST /users/subject/) 조합으로 일괄 교체.
 *
 * 운영에 SubscribeSubject DELETE 엔드포인트가 없어 다음 한계가 있다:
 *  - 감소 케이스(current.length > target.length): 짝지을 수 있는 만큼 PUT으로 교체하고
 *    남은 current 라벨은 운영 DB에 잔여로 남는다. 폐지 키워드라면 브리핑에 영향 없음.
 */
export const applyKeywordMigration = async (
  email: string,
  subjects: string[],
  opts?: { userId?: number; currentSubjects?: string[]; name?: string },
): Promise<{ user_id: number; email: string; subjects: string[]; leftover: string[] }> => {
  const userId =
    opts?.userId ?? (await getUserByEmail(email, opts?.name ?? null)).id;
  const current =
    opts?.currentSubjects ?? (await fetchSubscribedSubjects(email, opts?.name ?? ""));

  const targetSet = new Set(subjects);
  const currentSet = new Set(current);
  const toRemove = current.filter((s) => !targetSet.has(s));
  const toAdd = subjects.filter((s) => !currentSet.has(s));

  // 1) 짝지어 PUT 교체 (old → new)
  const pairCount = Math.min(toRemove.length, toAdd.length);
  for (let i = 0; i < pairCount; i++) {
    await updateUserSubject(userId, toRemove[i], toAdd[i]);
  }
  // 2) 남는 toAdd → 신규 POST
  for (let i = pairCount; i < toAdd.length; i++) {
    await subscribeSubject({ userId, subjectName: toAdd[i] });
  }
  // 3) 남는 toRemove → DELETE 엔드포인트 부재로 처리 불가. 잔여 보고만.
  const leftover = toRemove.slice(pairCount);
  if (leftover.length > 0) {
    console.warn(
      `[migration] 운영 DELETE 미지원으로 잔여 키워드: ${leftover.join(", ")}`,
    );
  }
  return { user_id: userId, email, subjects, leftover };
};

export const subscribeSubject = async ({
  userId,
  subjectName,
  articleId,
}: {
  userId: number;
  subjectName: string;
  articleId?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/subject/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        subject_name: subjectName,
        article_id: articleId,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const detail =
        typeof errorBody?.detail === "string"
          ? errorBody.detail
          : `키워드 구독에 실패했습니다: ${response.status}`;
      throw new Error(detail);
    }

    return response.json();
  } catch (error) {
    console.error("Error subscribing subject:", error);
    throw error;
  }
};

export async function fetchTopVideosBySection(section: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/briefing/top_videos/section?section=${encodeURIComponent(
        section,
      )}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch top videos for section: ${section}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching top videos:", error);
    throw error;
  }
}

const STOCK_API_URL = "https://youticle.shop/briefing/top_videos/stock";

export async function fetchStockVideo() {
  try {
    const response1 = await fetch(STOCK_API_URL, {
      method: "GET",
      cache: "no-store",
    });

    if (!response1.ok) {
      throw new Error("API request failed");
    }
    const data1 = response1.json();
    return data1;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

const EDITOR_API_URL = "https://youticle.shop/editor/all/article";
const EDITOR_API_LOCAL_URL = "http://0.0.0.0:8000/editor/all/article";

export async function fetchEditorArticle() {
  try {
    const response1 = await fetch(EDITOR_API_URL, {
      method: "GET",
      cache: "no-store",
    });

    if (!response1.ok) {
      throw new Error("API request failed");
    }
    const data1 = response1.json();
    return data1;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
export interface ChannelArticle {
  video_id: string; // Add video_id to ChannelArticle
  id: string;
  title: string;
  section: string;
  upload_date: string;
  summary_data: any;
  channel_details: ChannelDetails;

  thumbnail: string; // Ensure thumbnail exists
  views: number; // Add views
  likes: number; // Add likes (if necessary)
  score: number; // Add score for sorting
  duration: string; // Add duration if it's needed
  // … 필요하다면 thumbnail, etc 추가
  comments: number;
  subscribers: number;
}

export interface ChannelDetailResponse {
  channel: {
    /* 생략 */
  };
  today_articles: ChannelArticle[];
  past_articles: ChannelArticle[];
}

export async function fetchChannelDetail(
  channel_handle: string,
): Promise<ChannelDetailResponse> {
  const res = await fetch(
    `${API_BASE_URL}/editor/user_channels/detail?channel_handle=${encodeURIComponent(
      channel_handle,
    )}`,
  );
  if (!res.ok) throw new Error("채널 상세 조회 실패");
  return res.json();
}

export async function logCtaClick(
  action: string,
  userId?: number,
  userEmail?: string,
  anonId?: string,
  context: Record<string, string> = {},
) {
  const params = new URLSearchParams();
  params.set("action", action);
  if (userId) params.set("user_id", String(userId));
  if (userEmail) params.set("user_email", userEmail);
  if (anonId) params.set("anon_id", anonId);
  // ★ 웹에서는 redirect=false를 꼭 붙여서 호출
  // 🚀 추가 수집 정보
  Object.entries(context).forEach(([key, val]) => {
    if (val) params.set(key, val);
  });

  params.set("redirect", "false");

  try {
    const resp = await fetch(
      `https://youticle.shop/emails/cta-click?${params}`,
      {
        method: "GET",
      },
    );
    // (필요하다면 resp.json()으로 결과 확인)
  } catch (err) {
    console.error("CTA 클릭 로그 저장 중 오류:", err);
  }
}

// src/api/apiClient.ts
export interface NotificationRequestPayload {
  anon_id: string;
  user_id?: number;
  phone?: string;
  schedule?: string;
  channel_name?: string;
  section_key?: string;
}

export interface NotificationRequest {
  id: number;
  anon_id: string;
  user_id?: number;
  phone?: string;
  schedule?: string;
  channel_name?: string;
  requested_at: string;
  section_key?: string;
}

export async function upsertNotificationRequest(
  data: NotificationRequestPayload,
) {
  const res = await fetch(`${API_BASE_URL}/users/notification-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `upsertNotificationRequest failed (${res.status}): ${text}`,
    );
  }
  return (await res.json()) as {
    id: number;
    user_id: number | null;
    anon_id: string;
    phone: string | null;
    schedule: string | null;
    channel_name: string | null;
    requested_at: string;
  };
}
