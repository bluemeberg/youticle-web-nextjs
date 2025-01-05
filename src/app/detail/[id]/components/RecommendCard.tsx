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
    const navigatePath =
      props.path === "editor" ? `/editor/${video_id}` : `/detail/${video_id}`;
    router.push(navigatePath);
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
