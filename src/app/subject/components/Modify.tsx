"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import { useRouter } from "next/navigation";
import { fetchSubscribedSubjects, getUserByEmail } from "../../api/apiClient";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { updateUserSubject } from "../../api/apiClient";

// 전체 주제 목록 및 아이콘
const topics = [
  { name: "주식", icon: "📈" },
  { name: "부동산", icon: "🏢" },
  { name: "가상자산", icon: "💰" },
  { name: "경제", icon: "💵" },
  { name: "정치", icon: "🏛️" },
  { name: "비즈니스/사업", icon: "💼" },
  { name: "건강", icon: "🩺" },
  { name: "피트니스/운동", icon: "🏋️" },
  //   { name: "스포츠", icon: "⚽" },
  { name: "연애/결혼", icon: "❤️" },
  { name: "육아", icon: "👶" },
  { name: "뷰티/메이크업", icon: "💄" },
  { name: "여자 패션", icon: "👗" },
  { name: "남자 패션", icon: "👔" },
  { name: "인공지능", icon: "🤖" },
  { name: "IT/테크", icon: "💻" },
  { name: "자동차", icon: "🚗" },
  { name: "요리", icon: "🍳" },
  //   { name: "게임", icon: "🎮" },
  { name: "여행", icon: "✈️" },
  { name: "과학", icon: "🔬" }, // 과학 항목 추가
  { name: "역사", icon: "📜" }, // 역사 항목 추가
];

const SubscriptionPage = () => {
  const router = useRouter();
  const user = useRecoilValue(userState);
  console.log(user);
  const [subscribedSubjects, setSubscribedSubjects] = useState<string[]>([]);
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([]);
  const [initialSubscribedSubjects, setInitialSubscribedSubjects] = useState<
    string[]
  >([]);

  const [unsubscribedTopics, setUnsubscribedTopics] = useState<
    { name: string; icon: string }[]
  >(topics.filter((topic) => !subscribedSubjects.includes(topic.name)));
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    // 구독된 주제를 API로 가져와서 상태에 설정
    const fetchSubjects = async () => {
      if (user.email) {
        const subjects = await fetchSubscribedSubjects(user.email);
        setSubscribedSubjects(subjects);
        setInitialSubscribedSubjects(subjects);

        // 초기 필터링: 구독되지 않은 주제만 필터링하여 설정
        const unsubscribed = topics.filter(
          (topic) => !subjects.includes(topic.name)
        );
        setUnsubscribedTopics(unsubscribed);
      }
    };
    fetchSubjects();
  }, [user.email]);

  const handleRemoveTopic = (topic: string) => {
    setSubscribedSubjects((prev) => prev.filter((t) => t !== topic));
    const removedTopic = topics.find((t) => t.name === topic);
    if (removedTopic) setUnsubscribedTopics((prev) => [...prev, removedTopic]);
  };

  const handleAddTopic = (topic: string) => {
    if (subscribedSubjects.length < 3) {
      setSubscribedSubjects((prev) => [...prev, topic]);
      setUnsubscribedTopics((prev) => prev.filter((t) => t.name !== topic));
    } else {
      setModalMessage("⚠️ 최대 3개의 주제만 구독할 수 있습니다.");
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    if (subscribedSubjects.length < 3) {
      setModalMessage("⚠️ 3개의 주제를 선택해야 합니다.");
      setShowModal(true);
      return;
    }
    const newTopics = subscribedSubjects.filter(
      (topic) => !initialSubscribedSubjects.includes(topic)
    );
    const removedTopics = initialSubscribedSubjects.filter(
      (topic) => !subscribedSubjects.includes(topic)
    );
    console.log(newTopics);
    console.log(removedTopics);
    // 변경된 구독 키워드가 없을 때 팝업 발생
    if (removedTopics.length === 0 && newTopics.length === 0) {
      setModalMessage("구독 키워드가 변경되지 않았습니다.");
      setShowModal(true);
      return;
    }
    try {
      // 변경된 항목을 PUT 요청으로 전송
      for (let i = 0; i < newTopics.length; i++) {
        const data = await getUserByEmail(user.email);
        // 주제 등록
        console.log(data.id);
        await updateUserSubject(data.id, removedTopics[i] || "", newTopics[i]);
      }
      setModalMessage("구독 키워드가 성공적으로 업데이트되었습니다.");
      setShowModal(true);
      router.push(`/today`);
    } catch (error) {
      console.error("주제 업데이트 중 오류 발생:", error);
      setModalMessage(
        "주제를 업데이트하는 데 문제가 발생했습니다. 다시 시도해 주세요."
      );
      setShowModal(true);
    }
  };

  return (
    <Container>
      <LogoHeader />
      <Title>구독 키워드 변경</Title>
      <Subtitle>
        현재 구독 중인 키워드를 구독 해제 후 새 키워드를 선택해주세요. 3개의
        키워드 선택이 가능합니다.
      </Subtitle>
      {/* 모달 */}
      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowModal(false)}>×</ModalClose>
            <ModalMessage>{modalMessage}</ModalMessage>
          </ModalContent>
        </ModalOverlay>
      )}
      <Section bgColor="#E0E7FF">
        <SectionTitle>현재 구독 중인 키워드</SectionTitle>
        <TopicContainer>
          {subscribedSubjects.map((topic) => (
            <Topic
              key={topic}
              selected
              onClick={() => handleRemoveTopic(topic)}
            >
              {topics.find((t) => t.name === topic)?.icon} {topic}
              <RemoveButton>해제</RemoveButton>
            </Topic>
          ))}
        </TopicContainer>
      </Section>

      <Section bgColor="#F8F9FA">
        <SectionTitle>미구독한 키워드 선택하기</SectionTitle>
        <TopicContainer>
          {unsubscribedTopics.map((topic) => (
            <Topic key={topic.name} onClick={() => handleAddTopic(topic.name)}>
              <TopicIcon>{topic.icon}</TopicIcon> {topic.name}
            </Topic>
          ))}
        </TopicContainer>
      </Section>
      <ButtonContainer>
        <ConfirmButton onClick={handleConfirm}>변경하기</ConfirmButton>
      </ButtonContainer>
    </Container>
  );
};

export default SubscriptionPage;

// 스타일 정의 (기존 코드 유지)
const Container = styled.div`
  text-align: center;
  padding-top: 80px;
  background-color: #fbfcff;
  font-family: "Pretendard Variable";
`;

// 모달 스타일 정의
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 400px;
  position: relative;
`;

const ModalClose = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  font-size: 20px;
`;

const ModalMessage = styled.p`
  font-size: 16px;
  font-weight: 500;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-left: 16px;
  margin-right: 16px;
  line-height: 120%;
`;

const Subtitle = styled.div`
  font-size: 16px;
  margin-top: 8px;
  font-weight: 500;
  color: #555;
  margin: 20px;
  line-height: 130%;
`;

const Section = styled.div<{ bgColor: string }>`
  background-color: ${({ bgColor }) => bgColor};
  border-radius: 4px;
  padding: 20px;
  margin: 12px;
  margin-top: 40px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
`;

const TopicContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const Topic = styled.div<{ selected?: boolean }>`
  background-color: ${({ selected }) => (selected ? "#D1E4FF" : "#f0f0f0")};
  color: ${({ selected }) => (selected ? "#333333" : "#000000")};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  transition: background-color 0.3s, color 0.3s;
  margin-top: 8px;
  &:hover {
    background-color: ${({ selected }) => (selected ? "#AAC4FF" : "#e0e0e0")};
  }
`;

const RemoveButton = styled.span`
  font-size: 14px;
  color: #007bff;
  margin-left: 8px;
`;

const TopicIcon = styled.span`
  font-size: 18px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 15px;
`;

const ConfirmButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 16px 20px;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  font-weight: 700;
  transition: background-color 0.3s;
  width: 90%;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 100px;
  &:hover {
    background-color: #0056b3;
  }
`;
