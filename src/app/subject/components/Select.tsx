"use client";

import React, { useState } from "react";
import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { useRouter } from "next/navigation";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}
// 주제 목록 및 아이콘
const topics = [
  { name: "주식", icon: "📈" },
  { name: "부동산", icon: "🏢" },
  { name: "가상자산", icon: "💰" },
  { name: "경제", icon: "💵" }, // "경제" 항목 추가
  { name: "정치", icon: "🏛️" },
  { name: "비즈니스/사업", icon: "💼" },
  { name: "건강", icon: "🩺" },
  { name: "피트니스/운동", icon: "🏋️" },
  { name: "스포츠", icon: "⚽" },
  { name: "연애/결혼", icon: "❤️" },
  { name: "육아", icon: "👶" },
  { name: "뷰티/메이크업", icon: "💄" },
  { name: "여자 패션", icon: "👗" },
  { name: "남자 패션", icon: "👔" },
  { name: "인공지능", icon: "🤖" },
  { name: "IT/테크", icon: "💻" },
  { name: "자동차", icon: "🚗" },
  { name: "요리", icon: "🍳" },
  { name: "게임", icon: "🎮" },
];

const App = () => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [modalMessage, setModalMessage] = useState<string>(""); // 모달 메시지 상태
  const [showModal, setShowModal] = useState<boolean>(false); // 모달 표시 여부 상태
  const setUser = useSetRecoilState(userState);
  const router = useRouter();

  const handleTopicClick = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else if (selectedTopics.length < 3) {
      setSelectedTopics([...selectedTopics, topic]);
    } else {
      setModalMessage("⚠️ 최대 3개의 키워드의 선택할 수 있습니다.");
      setShowModal(true);
    }
  };
  const handleSubscribe = () => {
    if (selectedTopics.length === 0) {
      setModalMessage("⚠️ 최소 1개의 키워드를 선택해주세요.");
      setShowModal(true);
    } else if (selectedTopics.length < 3) {
      setModalMessage("⚠️ 3개의 주제를 선택해주세요.");
      setShowModal(true);
    } else {
      setModalMessage(
        "로그인이 필요합니다. 구독한 주제를 이메일로 받아보실 수 있습니다."
      );
      setShowModal(true);
    }
  };

  // 유저 정보 최초 등록
  const createOrFetchUser = async (email: string, name: string) => {
    const url = `https://youticle.shop/users/${encodeURIComponent(email)}`;
    const localUrl = `http://0.0.0.0:8000/users/${encodeURIComponent(email)}`;

    try {
      const response = await fetch("https://youticle.shop/users/", {
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
      console.log("유저 정보:", data);
      // // 키워드가 있다면 대기 페이지로 이동
      // getKeywordReportsForUser(data.id);
      return data;
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
    }
  };

  // 유저 정보 가져오기
  const getUserByEmail = async (
    email: string,
    name: string
  ): Promise<{ id: number }> => {
    const url = `https://youticle.shop/users/${encodeURIComponent(email)}`;
    const localUrl = `http://0.0.0.0:8000/users/${encodeURIComponent(email)}`;

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
        // 새로운 유저 생성 로직
        const newUser = await createOrFetchUser(email, name);
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

  const handleLoginSuccess = async (user: User) => {
    setShowModal(false); // 팝업 닫기
    console.log(user);
    if (user.email !== "") {
      // user 정보 등록 확인, 없으면 신규 등록함
      const data = await getUserByEmail(user.email, user.displayName);
      // 주제 등록
      console.log(data.id);
      setUser({
        name: user.displayName,
        email: user.email,
        picture: user.photoURL,
        id: data.id,
      });
      // 주제 등록
      for (const subject of selectedTopics) {
        try {
          const response = await fetch("https://youticle.shop/users/subject/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: data.id, // 여기서 data.id는 사용자 ID
              subject_name: subject,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to add subject: ${subject}`);
          }

          const responseData = await response.json();
          console.log(`Subject ${subject} added for user:`, responseData);
        } catch (error) {
          console.error(`Error adding subject ${subject}:`, error);
        }
      }
    }
    router.push(`/today`);
  };
  return (
    <Container>
      <LogoHeader />
      <Title>
        관심있는 3개의 키워드를 <br />
        선택해주세요!
      </Title>
      {/* <Subtitle>
        최대 3개의 주제를 선택하고, 최신 유튜브 아티클을 받아보세요.
      </Subtitle> */}
      {/* 주제 선택 */}
      <TopicMenu>
        {/* 첫 번째 카테고리 그룹 */}
        <TopicGroup>
          {topics.slice(0, 6).map((topic) => (
            <Topic
              key={topic.name}
              selected={selectedTopics.includes(topic.name)}
              onClick={() => handleTopicClick(topic.name)}
            >
              <TopicIcon>{topic.icon}</TopicIcon>
              {topic.name}
            </Topic>
          ))}
        </TopicGroup>
        <TopicDivider />

        {/* 두 번째 카테고리 그룹 */}
        <TopicGroup>
          {topics.slice(6, 9).map((topic) => (
            <Topic
              key={topic.name}
              selected={selectedTopics.includes(topic.name)}
              onClick={() => handleTopicClick(topic.name)}
            >
              <TopicIcon>{topic.icon}</TopicIcon>
              {topic.name}
            </Topic>
          ))}
        </TopicGroup>
        <TopicDivider />

        {/* 세 번째 카테고리 그룹 */}
        <TopicGroup>
          {topics.slice(9, 14).map((topic) => (
            <Topic
              key={topic.name}
              selected={selectedTopics.includes(topic.name)}
              onClick={() => handleTopicClick(topic.name)}
            >
              <TopicIcon>{topic.icon}</TopicIcon>
              {topic.name}
            </Topic>
          ))}
        </TopicGroup>
        <TopicDivider />

        {/* 네 번째 카테고리 그룹 */}
        <TopicGroup>
          {topics.slice(14, 19).map((topic) => (
            <Topic
              key={topic.name}
              selected={selectedTopics.includes(topic.name)}
              onClick={() => handleTopicClick(topic.name)}
            >
              <TopicIcon>{topic.icon}</TopicIcon>
              {topic.name}
            </Topic>
          ))}
        </TopicGroup>
      </TopicMenu>
      {/* 무료 구독 혜택 */}
      <BenefitsSection>
        <FreeBenefitsTitle>{FREE_BENEFITS_TITLE}</FreeBenefitsTitle>
        <FreeBenefitsDesc
          dangerouslySetInnerHTML={{ __html: FREE_BENEFITS_DESC }}
        />
      </BenefitsSection>
      {/* 모달창 */}
      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowModal(false)}>×</ModalClose>
            {/* 모달 메시지와 메시지 타입에 따른 UI */}
            {modalMessage.includes("⚠️") ? (
              <WarningMessage>{modalMessage}</WarningMessage>
            ) : (
              <>
                <InfoMessage>🙋로그인이 필요합니다.</InfoMessage>
                <InfoDescription>
                  더 빠르고 편리하게 아티클을 확인할 수 있도록 <br />{" "}
                  <span>이메일로도 아티클을 매일 제공</span>하고 있습니다.{" "}
                  <br /> 구글 계정과 연동해주세요.
                </InfoDescription>
                <GoogleLogin onLoginSuccess={handleLoginSuccess} />
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
      <ButtonContainer>
        <ServiceButton onClick={handleSubscribe}>
          지금 바로 무료 구독하러가기 👉🏻
        </ServiceButton>
      </ButtonContainer>
    </Container>
  );
};

// 스타일 정의
const Container = styled.div`
  text-align: center;
  padding-top: 80px;
  background-color: #fbfcff;
  font-family: "Pretendard Variable";
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-left: 16px;
  margin-right: 16px;
  line-height: 120%;
  font-family: "Pretendard Variable";
`;

const TopicMenu = styled.div`
  padding: 20px;
  margin-top: 16px;
  margin-bottom: 24px;
`;

const TopicGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
`;

const Topic = styled.div<{ selected: boolean }>`
  background-color: ${({ selected }) => (selected ? "#007bff" : "#ffff")};
  color: ${({ selected }) => (selected ? "#ffffff" : "#000")};
  padding: 10px 14px;
  border: 1px solid #007bff;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  font-size: 14px;
  align-items: center;
  gap: 5px;
  cursor: pointer;
`;

const TopicIcon = styled.span`
  font-size: 18px;
`;

const TopicDivider = styled.hr`
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 16px 0;
`;

const BenefitsSection = styled.div`
  background-color: #e0e7ff;
  padding: 16px;
  border-radius: 8px;
  margin-left: 20px;
  margin-right: 20px;
  font-family: "Pretendard Variable";
`;

const BenefitsTitle = styled.h2`
  font-size: 20px;
  margin-bottom: 20px;
  color: #000;
  font-weight: 700;
  margin-top: 12px;
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  text-align: left;
  line-height: 132%;
`;

const BenefitItem = styled.li`
  font-size: 16px;
  margin-bottom: 8px;
  color: #000;
  font-weight: 400;
  &:before {
    content: "✅";
    margin-right: 8px;
    color: #007bff;
  }
`;

const ServiceButton = styled.button`
  width: 100%;
  margin-left: 20px;
  margin-right: 20px;
  height: 60px;
  background-color: #007bff;
  color: #fff;
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  border-radius: 4px;
  cursor: pointer;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
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
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  top: 10px;
  right: 10px;
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
  padding: 10px 20px;
  border-radius: 5px;
  margin-top: 20px;
  cursor: pointer;
`;

// 개선된 모달 UI - 경고성, 제한 알림, 안내성 모달의 스타일
const WarningMessage = styled.p`
  color: red;
  font-weight: bold;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

// 안내성 모달 텍스트 및 아이콘 구분
const InfoMessage = styled.p`
  color: #333;
  margin-top: 10px;
  font-weight: bold;
  font-size: 20px;
  margin-bottom: 12px;
`;

const FreeBenefitsTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #000;
  margin-bottom: 16px;
  margin-top: 12px;
`;

const FreeBenefitsDesc = styled.div`
  font-size: 18px;
  color: #000;
  font-weight: 400;
  line-height: 1.4;
  margin-top: 20px;
  margin-bottom: 12px;
  li {
    margin-top: 12px;
  }
`;

const FREE_BENEFITS_TITLE = "🎁 무료 구독 혜택";
const FREE_BENEFITS_DESC = `
  <ul>
    <li>1️⃣ 매일 구독한 키워드의 아티클 전문 읽기.</li>
    <li>2️⃣ 매일 이메일로 아티클 편하게 확인하기.</li>
    <li>3️⃣ 오늘 놓친 이전 아티클 무제한 조회하기.</li>
  </ul>`;

export default App;
