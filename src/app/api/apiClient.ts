// apiClient.ts

const API_BASE_URL = "https://youticle.shop";
const LOCAL_API_BASE_URL = "http://0.0.0.0:8000";
// 유저 정보 최초 등록
export const createOrFetchUser = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log("유저 정보:", data);
    return data;
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
    throw error;
  }
};

// 유저 정보 가져오기
export const getUserByEmail = async (
  email: string
): Promise<{ id: number }> => {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(email)}`;

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
      const newUser = await createOrFetchUser(email);
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
  email: string
): Promise<string[]> => {
  try {
    // user_id 정보 가져오기
    const userData = await getUserByEmail(email);
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
