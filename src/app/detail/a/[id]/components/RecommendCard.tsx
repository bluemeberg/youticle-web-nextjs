"use client"; // Ensure the component is treated as a client component

import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { useSetRecoilState } from "recoil";
import { detailDataState } from "@/store/detailData";
import { DataProps } from "@/types/dataProps";
import { timeAgo } from "@/utils/formatter";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface RecommendCardProps extends DataProps {
  icon: React.ReactNode;
  path: string;
  source: string;
}

const RecommendCard = (props: RecommendCardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, , , channelHandle] = pathname.split("/"); // "@ttimestv"

  const setTopicState = useSetRecoilState(detailDataState);
  const { video_id, summary_data, thumbnail, upload_date } = props;
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  // Convert UTC to KST (Korean Standard Time)
  const convertToKST = (utcDate: string) => {
    const date = new Date(utcDate);
    // Convert UTC to KST (Korean Standard Time is UTC + 9)
    date.setHours(date.getHours() + 9);
    return date;
  };

  const kstDate: Date = convertToKST(upload_date); // KST 시간 변환

  const handleNavigate = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "recommend_card_click", {
        event_category: "navigation",
        event_label: props.summary_data.headline_title,
        value: props.video_id,
      });
    }
    if (isLoading) return; // 중복 클릭 방지

    setIsLoading(true);
    setTopicState(props);
    // 1) 기존 path 분기 + 새 "studio" 분기 추가
    setTimeout(() => {
      if (props.path === "studio") {
        // 예: "/studio/:id" 경로로 이동,
        // API 소스가 'editor'인지 'briefing'인지도 함께 query param으로
        const sourceParam = props.source === "editor" ? "editor" : "briefing";
        router.push(`/studio/${props.video_id}?source=${sourceParam}`);
      } else if (
        pathname.startsWith("/studio/channel") &&
        channelHandle &&
        props.path !== "detail"
      ) {
        router.push(`/studio/channel/${channelHandle}/${props.id}`);
      } else if (props.path === "editor") {
        router.push(`/editor/${props.video_id}`);
      } else {
        // default = "detail"
        router.push(`/detail/${props.video_id}`);
      }
    }, 800);
  };

  return (
    <Container onClick={handleNavigate}>
      {isLoading && (
        <LoadingOverlay>
          <Spinner />
        </LoadingOverlay>
      )}
      <Thumbnail src={thumbnail} />
      <Info>
        <Title>{summary_data.headline_title}</Title>
        <UploadTime>{timeAgo(kstDate.toISOString())}</UploadTime>
      </Info>
    </Container>
  );
};

export default RecommendCard;

const Container = styled.div`
  display: flex;
  gap: 8px;
  padding: 20px 0;
  background: rgba(255, 255, 255, 1);
  border-bottom: 1px solid rgba(172, 172, 172, 1);
  font-family: "Pretendard Variable";
  cursor: pointer;
`;

const Thumbnail = styled.img`
  object-fit: cover;
  height: 80px;
  min-width: 140px;
  max-width: 140px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.span`
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
`;

const UploadTime = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 14.32px;
  color: #494949;
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
