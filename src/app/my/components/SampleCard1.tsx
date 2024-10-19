"use client"; // 클라이언트 컴포넌트임을 명시

import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  parseSubscribersCount,
  removeMarkTags,
  timeAgo,
} from "@/utils/formatter";

const SUMMARY_DATA = {
  headline_title: "알리바바 급등의 비밀",
  headline_sub_title: "왜 지금 알리바바를 주목해야 할까?",
  short_summary:
    "알리바바의 주가는 최근 20% 상승하며 투자자들의 관심을 끌고 있습니다. 중국 정부의 경제 부양책과 함께, 알리바바의 저평가가 해소되며 주가가 급등하고 있는 상황이에요. 특히, 마이클 부르의 알리바바 주식 보유량 증가가 주가 상승에 긍정적인 영향을 미치고 있어요.",
  section: [[Object], [Object], [Object], [Object], [Object], [Object]],
  views: 2289,
  likes: 98,
  comments: 72,
  subscribers: 0,
  score: 0.926043812020221,
};
const CHANNEL_DETAILS = {
  channel_id: "UCFqXmQ56 - Gp1rIKa - GoAJvQ",
  channel_name: "Andy Stapleton",
  channel_subscribers: 259000,
  channel_video_count: 523,
  channel_view_count: 19028104,
  channel_thumbnail:
    "https://yt3.ggpht.com/ytc/AIdro_ndQolRBIdQMrEWMSLhghYFmLLkJZKWmywT6fe5uAaeVfk=s88-c-k-c0x00ffffff-no-rj",
  channel_banner:
    "https://yt3.ggpht.com/ytc/AIdro_ndQolRBIdQMrEWMSLhghYFmLLkJZKWmywT6fe5uAaeVfk=s800-c-k-c0x00ffffff-no-rj",
};

const THUMBNAIL = "https://i.ytimg.com/vi/wTw5JOs_MUw/sddefault.jpg";
const UPLOAD_DATE = "2024-10-15T01:30:35";

const SampleCard = () => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/samplePage`);
  };

  const short_summary = removeMarkTags(SUMMARY_DATA.short_summary);

  return (
    <Container onClick={handleNavigate}>
      <CardHeader>
        <Section>#인공지능</Section>
        <Title>AI 도구의 혁신, 어떤 도구가 연구에 도움이 될까?</Title>
      </CardHeader>
      <Body>
        <Summary>
          <p>{short_summary}</p>
        </Summary>
        <Thumbnail src={THUMBNAIL} />
      </Body>
      <ChannelInfo>
        <ProfileImage src={CHANNEL_DETAILS.channel_thumbnail}></ProfileImage>
        <ProfileInfo>
          <Name>{CHANNEL_DETAILS.channel_name}</Name>
          <SubsUpload>
            <Subscriber>
              {parseSubscribersCount(CHANNEL_DETAILS.channel_subscribers)}
            </Subscriber>
            <UploadTime> {timeAgo(UPLOAD_DATE)}</UploadTime>
          </SubsUpload>
        </ProfileInfo>
      </ChannelInfo>
    </Container>
  );
};

export default SampleCard;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  gap: 10px;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.24); /* 카드 느낌을 주는 그림자 효과 */
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
`;

const SubsUpload = styled.div`
  display: flex;
`;

const Section = styled.div`
  font-size: 14px;
  color: #007bff;
  font-weight: 700;
`;

const Body = styled.div`
  display: flex;
  align-items: center;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 800;
  line-height: 28px;
`;

const Summary = styled.div`
  border-radius: 4px;
  margin-right: 12px;
  p {
    font-size: 16px;
    font-weight: 400;
    line-height: 140%;
    color: rgb(60 60 61);
    display: -webkit-box;
    word-break: break-word;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    box-sizing: border-box;
  }
`;

const Thumbnail = styled.img`
  object-fit: cover;
  border-radius: 4px;
  width: 42%;
  aspect-ratio: 132 / 72;
`;

const UploadTime = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  height: 36px;
  margin-top: 12px;
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
  line-height: 19.6px;
`;

const Subscriber = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
  margin-right: 8px;
`;
