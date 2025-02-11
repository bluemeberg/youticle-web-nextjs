"use client"; // 클라이언트 컴포넌트임을 명시

import { useRouter, usePathname } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { useSetRecoilState } from "recoil";
import { detailDataState } from "@/store/detailData";
import { DataProps } from "@/types/dataProps";
import {
  parseSubscribersCount,
  timeAgo,
  removeMarkTags,
  parseVideoCountcribersCount,
} from "@/utils/formatter";
import LikeIcon from "@/assets/like_icon.svg";
import ViewIcon from "@/assets/view_icon.svg";
import { useEffect, useState } from "react";

interface TopicCardProps extends DataProps {
  icon: React.ReactNode;
  subjects: string[]; // 구독 키워드 전달
}

const YOUTUBE_TOPICS = [
  { topic: "전체", icon: "🌐" },
  { topic: "주식", icon: "📈" },
  { topic: "부동산", icon: "🏢" },
  { topic: "가상자산", icon: "💰" },
  { topic: "경제", icon: "💵" },
  { topic: "정치", icon: "🏛️" },
  { topic: "비즈니스/사업", icon: "💼" },
  { topic: "건강", icon: "🩺" },
  { topic: "피트니스", icon: "🏋️" },
  { topic: "연애/결혼", icon: "❤️" },
  { topic: "육아", icon: "👶" },
  { topic: "뷰티/메이크업", icon: "💄" },
  { topic: "여자 패션", icon: "👗" },
  { topic: "남자 패션", icon: "👔" },
  { topic: "요리", icon: "🍳" },
  { topic: "IT/테크", icon: "💻" },
  { topic: "인공지능", icon: "🤖" },
  { topic: "자동차", icon: "🚗" },
  { topic: "여행", icon: "✈️" },
  { topic: "과학", icon: "🔬" },
  { topic: "역사", icon: "📜" },
];

const TopicCard = (props: TopicCardProps) => {
  const router = useRouter();
  const pathname = usePathname(); // 현재 경로 가져오기

  const setTopicState = useSetRecoilState(detailDataState);
  const {
    section,
    summary_data, // 새로운 summary_data 객체
    thumbnail,
    upload_date,
    channel_details, // 새로운 channel_details 객체
    icon,
    video_id,
    views,
    likes,
  } = props;

  const handleNavigate = () => {
    if (isLoading) return; // 중복 클릭 방지

    setIsLoading(true);
    setTopicState(props);

    // 현재 경로 확인 및 동적 라우팅
    console.log("Current Path:", pathname); // 현재 경로 디버깅 로그
    setTimeout(() => {
      if (pathname === "/editor") {
        router.push(`/editor/${video_id}`);
      } else {
        router.push(`/detail/${video_id}`);
      }
    }, 800); // 로딩 인터랙션을 위한 지연 (UI에서 확인 가능)
  };
  const short_summary = removeMarkTags(summary_data?.short_summary || "");
  const specialSections = ["주식"]; // 특정 주제 섹션 목록

  // 해당 섹션이 특정 주제인지 확인
  const isSpecialSection = specialSections.includes(section);

  // YOUTUBE_TOPICS에서 해당 섹션에 맞는 icon과 topic 가져오기
  const topicInfo = YOUTUBE_TOPICS.find((topic) => topic.topic === section);
  const isSubscribed = props.subjects.includes(section);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  return (
    <Container onClick={handleNavigate}>
      {isLoading && (
        <LoadingOverlay>
          <Spinner />
        </LoadingOverlay>
      )}
      <CardHeader>
        {/* <Section isSubscribed={isSubscribed}>
          {topicInfo?.icon} {topicInfo?.topic || section}
        </Section> */}
        {section === "주식" &&
        (summary_data?.key_points ||
          summary_data?.headline_sub_title === "") ? (
          <Title>
            {summary_data?.headline_title}
            {summary_data?.headline_sub_title}
          </Title>
        ) : (
          section !== "주식" && (
            <Title>
              {summary_data?.headline_title}
              {summary_data?.headline_sub_title}
            </Title>
          )
        )}
      </CardHeader>
      <BodyContainer>
        <Body>
          {isSpecialSection ? (
            <Summary>
              {summary_data?.headline_sub_title === "" ? (
                <ShortSummary>{short_summary}</ShortSummary> // headline_sub_title이 없을 경우 short_summary를 표시
              ) : (
                <BodyTitle>
                  {summary_data?.headline_title}...
                  {summary_data?.headline_sub_title}
                </BodyTitle>
                // <ShortSummary>{short_summary}</ShortSummary> // headline_sub_title이 없을 경우 short_summary를 표시
              )}
            </Summary>
          ) : (
            <Summary>
              <ShortSummary>{short_summary}</ShortSummary>
            </Summary>
          )}
        </Body>
        <ChannelInfoContainer>
          <Thumbnail src={thumbnail} />
          <VideoInfo>
            <ViewIcon /> <span>{parseVideoCountcribersCount(views)}</span>
            <LikeIcon /> <span>{parseVideoCountcribersCount(likes)}</span>
          </VideoInfo>
        </ChannelInfoContainer>
      </BodyContainer>

      <ChannelInfo>
        <ProfileImage src={channel_details.channel_thumbnail} />
        <ProfileInfo>
          <Name>{channel_details.channel_name}</Name>
          <SubsUpload>
            <Subscriber>
              {parseSubscribersCount(channel_details.channel_subscribers)}
            </Subscriber>
            <UploadTime>{timeAgo(upload_date)}</UploadTime>
          </SubsUpload>
        </ProfileInfo>
      </ChannelInfo>
    </Container>
  );
};

export default TopicCard;

// 스타일 정의
const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e0e0e0; /* 경계 테두리 */
  border-radius: 8px; /* 둥근 모서리 */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* 그림자 추가 */
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-left: 8px;
  margin-right: 8px;
  margin-top: 8px;
  &:hover {
    transform: translateY(-4px); /* 호버 시 위로 살짝 이동 */
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15); /* 호버 시 그림자 강조 */
  }
`;

/* 🛠 로딩 스타일 추가 */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Spinner = styled.div`
  width: 30px;
  height: 30px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #007bff;
  border-radius: 50%;
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

const LoadingOverlay = styled.div`
  /* background: rgba(234, 234, 234, 0.5); */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  animation: ${fadeIn} 0.3s ease-in-out;
  padding: 4px;
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
  align-items: flex-start; /* Section을 왼쪽 정렬 */
  width: 100%; /* 부모의 가로폭을 채움 */
  margin-bottom: 12px;
`;

const ShortSummary = styled.div`
  font-size: 16px;
  line-height: 140%;
  display: -webkit-box;
  -webkit-line-clamp: 4; /* 최대 5줄 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgb(60, 60, 61);
  text-overflow: ellipsis;
  margin-top: -2px;
`;

const BodyContainer = styled.div`
  display: flex;
  width: 100%;
`;

const SubsUpload = styled.div`
  display: flex;
`;

const Section = styled.div<{ isSubscribed: boolean }>`
  display: inline-flex; /* 텍스트 크기에 맞게 가로폭을 설정 */
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background-color: #f9fafc;
  padding: 6px 8px; /* 내부 여백 */
  border-radius: 4px; /* 둥근 테두리 */
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 넘치는 텍스트 말줄임표 처리 */
  box-sizing: border-box; /* 패딩 포함한 크기 계산 */
  color: ${({ isSubscribed }) =>
    isSubscribed ? "#007BFF" : "#80858a"}; /* 구독 여부에 따른 색상 */
  height: 32px;
  border: 1px solid
    ${({ isSubscribed }) => (isSubscribed ? "#007BFF" : "#c4c4c4")}; /* 구독 여부에 따른 테두리 */
`;

const Body = styled.div`
  display: flex;
  max-width: 64%; /* Body 영역을 60%로 설정 */
  min-width: 64%;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  margin-top: 4px;
`;

const BodyTitle = styled.span`
  font-size: 18px;
  font-weight: 700;
  line-height: 28px;
  margin-top: -8px;
`;

const SummaryContainer = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const Divider = styled.div<{ height: string }>`
  min-height: ${(props) => props.height};
  max-height: ${(props) => props.height};

  min-width: 6px;
  max-width: 6px;
  border-radius: 100%;
  margin-top: 4px;
  background-color: #000;
`;

const SummaryContent = styled.div<{ fontSize: string }>`
  margin-left: 4px;
  font-size: ${(props) => props.fontSize};
  line-height: 120%;
  font-weight: 400;
`;

const Summary = styled.div`
  border-radius: 4px;
  margin-right: 12px;
`;

const Thumbnail = styled.img`
  object-fit: cover;
  border-radius: 4px;
  width: 100%;
  height: auto;
  aspect-ratio: 132 / 72;
`;

const UploadTime = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
`;

const VideoInfo = styled.div`
  display: flex;
  font-size: 12px;
  align-items: center;
  margin-top: 4px;
  color: #696868;
  span {
    margin-left: 4px;
    margin-right: 8px;
  }
  svg {
    color: #696868;
  }
`;

const ChannelInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-basis: 40%; /* ChannelInfoContainer의 너비를 BodyContainer의 40%로 설정 */
  max-width: 40%;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  height: 36px;
  margin-top: 12px;
  /* margin-bottom: 24px; */
`;

const ProfileImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(217, 217, 217, 1);
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Name = styled.span`
  font-size: 14px;
  line-height: 128%;
  /* display: inline-block; */
  /* max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; */
`;

const Subscriber = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
  margin-right: 8px;
`;
