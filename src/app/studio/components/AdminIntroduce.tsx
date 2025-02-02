"use client";

import styled from "styled-components";
import TodayIcon from "@/assets/today.svg";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { dataState } from "@/store/data";
import { userState } from "@/store/user";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { getUserByEmail } from "@/api/apiClient";

interface ServiceIntroduceProps {
  subjects: string[]; // 추가된 subjects prop
}

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}

const SERVICE_TITLE = "📌 나만의 아티클 생성하기";
// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

const AdminIntroduce = () => {
  const router = useRouter();
  const setApiData = useSetRecoilState(dataState);
  const setUser = useSetRecoilState(userState);
  const user = useRecoilValue(userState); // 로그인 여부 확인
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [id, setId] = useState<string>(""); // 입력받은 id 상태
  const [section] = useState<string>("주식"); // 고정된 section 값
  console.log(id);
  const [loadingMessage, setLoadingMessage] = useState(""); // 로딩 메시지 상태
  const [loadingMessage2, setLoadingMessage2] = useState(""); // 로딩 메시지 상태

  const [showLoginModal, setShowLoginModal] = useState(false); // 로그인 모달 상태
  const [data, setData] = useState<any>(null); // 응답 데이터 상태
  console.log(data);

  // API 요청 함수
  const fetchSummaryEditorVideo = async () => {
    if (!user.email) {
      // 로그인이 안 되어 있다면 로그인 모달 표시
      setShowLoginModal(true);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 60초 타임아웃

    setIsLoading(true);
    setLoadingMessage("아티클을 생성 중입니다.");
    setLoadingMessage2(
      "최대 1분이 소요될 수 있습니다. \n페이지를 이탈하지 말아주세요!🙋"
    );
    try {
      console.log("hello");
      const extractVideoId = (urlOrId: any) => {
        try {
          const url = new URL(urlOrId);

          // youtu.be 형식일 경우 pathname에서 ID 추출
          if (url.hostname === "youtu.be") {
            return url.pathname.slice(1); // 첫 번째 '/' 이후의 값 반환
          }

          // youtube.com 형식일 경우 v 파라미터 값 추출
          if (url.hostname.includes("youtube.com")) {
            return url.searchParams.get("v") || urlOrId;
          }

          return urlOrId; // 다른 경우 그대로 반환
        } catch (error) {
          // URL 형식이 아니면 그대로 반환
          return urlOrId;
        }
      };

      // id가 URL 형태라면 파싱하여 videoId만 추출
      const videoId = extractVideoId(id);
      //   router.push(`/studio/${videoId}`); // ID 포함 URL로 이동

      // 영상 요약 호출하기
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/process/${encodeURIComponent(
          videoId
        )}?user_id=${encodeURIComponent(user.id)}`,
        {
          method: "GET",
          headers: {
            accept: "application/json", // JSON 응답 요청
          },
          signal: controller.signal, // AbortController를 통한 타임아웃
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
      }
      const { task_id } = await response.json(); // `task_id` 반환
      //   if (result === "success") {
      //     const response = await fetch(
      //       `http://0.0.0.0:8000/editor/article/${id}`,
      //       {
      //         method: "GET",
      //         headers: {
      //           accept: "application/json",
      //         },
      //       }
      //     );
      //     if (!response.ok) {
      //       throw new Error(`첫 번째 요청 실패: HTTP ${response.status}`);
      //     }
      //     const result = await response.json();
      //   }
      //   setData(result); // 응답 데이터 설정
      router.push(`/studio/${videoId}?task_id=${task_id}`); // ID 포함 URL로 이동
    } catch (err) {
      //   if (err instanceof Error) {
      //     if (err.name === "AbortError") {
      //       console.error("요청 시간이 초과되었습니다.");
      //       startPollingEditorArticle(id);
      //     } else {
      //       console.error("요청 실패:", err.message);
      //       startPollingEditorArticle(id);
      //     }
      //   } else {
      //     console.error("알 수 없는 오류:", err);
      //   }
    } finally {
      setIsLoading(false); // 로딩 종료
      clearTimeout(timeoutId); // 타임아웃 클리어
      setLoadingMessage(""); // 메시지 초기화
      setLoadingMessage2(""); // 메시지 초기화
    }
  };

  const fetchEditorArticle = async (id: string): Promise<any> => {
    const extractVideoId = (urlOrId: any) => {
      try {
        const url = new URL(urlOrId);

        // youtu.be 형식일 경우 pathname에서 ID 추출
        if (url.hostname === "youtu.be") {
          return url.pathname.slice(1); // 첫 번째 '/' 이후의 값 반환
        }

        // youtube.com 형식일 경우 v 파라미터 값 추출
        if (url.hostname.includes("youtube.com")) {
          return url.searchParams.get("v") || urlOrId;
        }

        return urlOrId; // 다른 경우 그대로 반환
      } catch (error) {
        // URL 형식이 아니면 그대로 반환
        return urlOrId;
      }
    };
    // id가 URL 형태라면 파싱하여 videoId만 추출
    const videoId = extractVideoId(id);
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/article/${videoId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("API 호출 실패");
      return await response.json();
    } catch (error) {
      console.error("API 호출 에러:", error);
      throw error; // 에러를 상위로 전달
    }
  };

  // 폴링 함수
  const startPollingEditorArticle = (id: string, interval: number = 1000) => {
    const maxAttempts = 60; // 최대 시도 횟수 (예: 60초 동안 시도)
    let attempts = 0;
    let lastData: any = null; // 마지막으로 설정된 데이터를 추적

    const polling = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        console.error("최대 시도 횟수를 초과했습니다. 폴링을 중단합니다.");
        clearInterval(polling);
        return;
      }
      const extractVideoId = (urlOrId: any) => {
        try {
          const url = new URL(urlOrId);

          // youtu.be 형식일 경우 pathname에서 ID 추출
          if (url.hostname === "youtu.be") {
            return url.pathname.slice(1); // 첫 번째 '/' 이후의 값 반환
          }

          // youtube.com 형식일 경우 v 파라미터 값 추출
          if (url.hostname.includes("youtube.com")) {
            return url.searchParams.get("v") || urlOrId;
          }

          return urlOrId; // 다른 경우 그대로 반환
        } catch (error) {
          // URL 형식이 아니면 그대로 반환
          return urlOrId;
        }
      };
      // id가 URL 형태라면 파싱하여 videoId만 추출
      const videoId = extractVideoId(id);
      try {
        console.log(`폴링 시도 ${attempts}...`);
        const articleData = await fetchEditorArticle(id);

        if (
          articleData &&
          JSON.stringify(articleData) !== JSON.stringify(lastData)
        ) {
          console.log("데이터 수신 성공:", articleData);
          setData(articleData); // 상태 업데이트
          lastData = articleData; // 마지막 데이터 업데이트
          clearInterval(polling); // 폴링 중단
          router.push(`/studio/${videoId}`); // ID 포함 URL로 이동
        }
      } catch (error) {
        console.error("폴링 중 오류:", error);
      }
    }, interval);
  };

  const handleLoginSuccess = async (user: User) => {
    setShowLoginModal(false);
    if (user.email !== "") {
      // 사용자 정보 등록 및 가져오기
      const data = await getUserByEmail(user.email, user.displayName);

      setUser({
        name: user.displayName,
        email: user.email,
        picture: user.photoURL,
        id: data.id,
      });

      // 구독 주제가 없을 때 주제 등록
      setIsLoading(true); // 로딩 시작
      setLoadingMessage("아티클을 생성 중입니다");
      setLoadingMessage2(
        "최대 1분이 소요될 수 있습니다. \n페이지를 이탈하지 말아주세요!🙋"
      );
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 60초 타임아웃
      console.log("hello1");

      const extractVideoId = (urlOrId: any) => {
        try {
          const url = new URL(urlOrId);

          // youtu.be 형식일 경우 pathname에서 ID 추출
          if (url.hostname === "youtu.be") {
            return url.pathname.slice(1); // 첫 번째 '/' 이후의 값 반환
          }

          // youtube.com 형식일 경우 v 파라미터 값 추출
          if (url.hostname.includes("youtube.com")) {
            return url.searchParams.get("v") || urlOrId;
          }

          return urlOrId; // 다른 경우 그대로 반환
        } catch (error) {
          // URL 형식이 아니면 그대로 반환
          return urlOrId;
        }
      };

      // id가 URL 형태라면 파싱하여 videoId만 추출
      const videoId = extractVideoId(id);
      //   router.push(`/studio/${videoId}`); // ID 포함 URL로 이동

      try {
        console.log("hello");
        // 영상 요약 호출하기
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/process/${encodeURIComponent(
            videoId
          )}?user_id=${encodeURIComponent(data.id)}`,
          {
            method: "GET",
            headers: {
              accept: "application/json", // JSON 응답 요청
            },
            signal: controller.signal, // AbortController를 통한 타임아웃
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        const { task_id } = await response.json(); // `task_id` 반환
        router.push(`/studio/${videoId}?task_id=${task_id}`); // ID 포함 URL로 이동

        // const result = await response.json();
        // if (result === "success") {
        //   const response = await fetch(
        //     `http://0.0.0.0:8000/editor/article/${videoId}`,
        //     {
        //       method: "GET",
        //       headers: {
        //         accept: "application/json",
        //       },
        //     }
        //   );
        //   if (!response.ok) {
        //     throw new Error(`첫 번째 요청 실패: HTTP ${response.status}`);
        //   }
        //   const result = await response.json();
        // }
        // setData(result); // 응답 데이터 설정
        // router.push(`/studio/${videoId}`); // ID 포함 URL로 이동
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            console.error("요청 시간이 초과되었습니다.");
            startPollingEditorArticle(id);
          } else {
            console.error("요청 실패:", err.message);
            startPollingEditorArticle(id);
          }
        } else {
          console.error("알 수 없는 오류:", err);
        }
      } finally {
        setIsLoading(false); // 로딩 종료
        clearTimeout(timeoutId); // 타임아웃 클리어
        setLoadingMessage("");
        setLoadingMessage2("");
      }
    }
  };

  return (
    <Container>
      <ContentBox>
        <TitleContainer>
          {/* <TodayIcon /> */}
          <ServiceTitle>{SERVICE_TITLE}</ServiceTitle>
        </TitleContainer>
        <Announcement>
          <Title>
            양질의 유튜브 영상 링크 입력하고, 나만의 아티클 생성하기!
          </Title>
        </Announcement>
      </ContentBox>

      <InputContainer>
        <Input
          type="text"
          placeholder="https://www.youtube.com/watch?v=abcd1234"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
      </InputContainer>
      <Guide>
        유튜브 URL을 복사해서 붙여넣거나, 공유 버튼으로 생성된 링크를
        입력하세요.
      </Guide>
      <Button onClick={fetchSummaryEditorVideo}>아티클 생성하기</Button>
      {/* 입력 가이드 */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingMessage>{loadingMessage}</LoadingMessage>
          <LoadingMessage>{loadingMessage2}</LoadingMessage>
        </LoadingOverlay>
      )}

      {showLoginModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowLoginModal(false)}>×</ModalClose>
            <InfoMessage>🙋 로그인이 필요합니다.</InfoMessage>
            <InfoDescription>
              나만의 아티클을 생성하려면 로그인해주세요.
            </InfoDescription>
            <GoogleLogin onLoginSuccess={handleLoginSuccess} />
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default AdminIntroduce;

// 스타일 정의
const Container = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  background-color: #f0f4ff;
  font-family: "Pretendard Variable";
  width: 100%;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const ContentBox = styled.div`
  background-color: #f0f4ff;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 12px;
  padding-top: 28px;
  margin-top: 4px;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ServiceTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin-left: 4px;
`;

const Announcement = styled.div``;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 400;
  color: #000;
  line-height: 128%;
  font-family: "Pretendard Variable";
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  max-width: 480px;
  margin: 16px 16px 4px 16px;
`;

const Input = styled.input`
  flex: 1;
  padding: 20px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: #ffffff;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  margin-left: 16px;
  margin-right: 16px;
  cursor: pointer;
  height: 60px;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  margin-bottom: 20px;
  &:hover {
    background-color: #0056b3;
  }
`;

const Guide = styled.p`
  font-size: 12px;
  color: #616161;
  margin-bottom: 32px;
  margin-left: 16px;
`;
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  max-width: 430px;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingMessage = styled.p`
  margin-top: 20px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  line-height: 132%;
  white-space: pre-line; // \n을 줄바꿈으로 처리
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px 16px 20px 16px;
  border-radius: 4px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const InfoDescription = styled.div`
  font-weight: 400;
  margin-bottom: 20px;
  text-align: left;
  margin-top: 8px;
  line-height: 132%;
  span {
    font-weight: 700;
  }
`;

const ModalClose = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
`;

const ModalButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 16px 8px;
  border-radius: 4px;
  margin-top: 20px;
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
`;

// 안내성 모달 텍스트 및 아이콘 구분
const InfoMessage = styled.p`
  color: #333;
  margin-top: 10px;
  font-weight: bold;
  font-size: 20px;
  margin-bottom: 12px;
  line-height: 132%;
`;
