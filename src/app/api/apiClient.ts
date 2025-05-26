// apiClient.ts

import { ChannelDetails } from "@/types/dataProps";

const API_BASE_URL = "https://youticle.shop";
// const API_BASE_URL = "http://0.0.0.0:8001";
// 유저 정보 최초 등록
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
  name: string | null
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
  name: string
): Promise<string[]> => {
  try {
    // user_id 정보 가져오기
    const userData = await getUserByEmail(email, name);
    const response = await fetch(
      `${API_BASE_URL}/users/subjects/${userData.id}`
    );
    if (response.ok) {
      const data = await response.json();
      const subjectNames = data.map(
        (item: { subject_name: string }) => item.subject_name
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
  newSubjectName: string
) => {
  const url = `${API_BASE_URL}/users/subject/?user_id=${userId}&old_subject_name=${encodeURIComponent(
    oldSubjectName
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

export async function fetchTopVideosBySection(section: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/briefing/top_videos/section?section=${encodeURIComponent(
        section
      )}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
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
  channel_handle: string
): Promise<ChannelDetailResponse> {
  const res = await fetch(
    `${API_BASE_URL}/editor/user_channels/detail?channel_handle=${encodeURIComponent(
      channel_handle
    )}`
  );
  if (!res.ok) throw new Error("채널 상세 조회 실패");
  return res.json();
}
