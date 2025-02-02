"use client"; // Ensure the component is treated as a client component

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useSetRecoilState } from "recoil";
import { detailDataState } from "@/store/detailData";
import { DataProps } from "@/types/dataProps";
import { timeAgo } from "@/utils/formatter";
import { usePathname } from "next/navigation";

interface RecommendCardProps extends DataProps {
  icon: React.ReactNode;
  path: string;
  source: string;
}

const RecommendCard = (props: RecommendCardProps) => {
  const router = useRouter();
  const setTopicState = useSetRecoilState(detailDataState);
  const { video_id, summary_data, thumbnail, upload_date } = props;

  const handleNavigate = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "recommend_card_click", {
        event_category: "navigation",
        event_label: props.summary_data.headline_title,
        value: props.video_id,
      });
    }
    setTopicState(props);
    // 1) 기존 path 분기 + 새 "studio" 분기 추가
    if (props.path === "studio") {
      // 예: "/studio/:id" 경로로 이동,
      // API 소스가 'editor'인지 'briefing'인지도 함께 query param으로
      const sourceParam = props.source === "editor" ? "editor" : "briefing";
      router.push(`/studio/${props.video_id}?source=${sourceParam}`);
    } else if (props.path === "editor") {
      router.push(`/editor/${props.video_id}`);
    } else {
      // default = "detail"
      router.push(`/detail/${props.video_id}`);
    }
  };

  return (
    <Container onClick={handleNavigate}>
      <Thumbnail src={thumbnail} />
      <Info>
        <Title>{summary_data.headline_title}</Title>
        <UploadTime>{timeAgo(upload_date)}</UploadTime>
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
  height: 64px;
  min-width: 120px;
  max-width: 120px;
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
