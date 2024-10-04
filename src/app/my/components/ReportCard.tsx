"use client"; // 클라이언트 컴포넌트임을 명시

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useSetRecoilState } from "recoil";
import { detailDataState } from "@/store/detailData";
import { ReportData } from "@/types/dataProps";
import {
  parseSubscribersCount,
  timeSinceUpload,
  removeMarkTags,
  timeAgo,
} from "@/utils/formatter";

const ReportCard = (props: ReportData) => {
  const router = useRouter();
  const setTopicState = useSetRecoilState(detailDataState);
  const {
    briefing_channel,
    briefing_video, // 새로운 summary_data 객체
    category,
    keyword,
    period, // 새로운 channel_details 객체
    user_id,
    video_id,
  } = props;

  const handleNavigate = () => {
    setTopicState(props);
    router.push(`/keyword/${video_id}`);
  };

  // 안전하게 briefing_channel가 null일 경우를 처리
  const channelThumbnail = briefing_channel?.thumbnail || "";
  const channelTitle = briefing_channel?.title || "Unknown Channel";
  const channelSubs = briefing_channel?.sub_count
    ? parseSubscribersCount(briefing_channel.sub_count)
    : "No Subscribers";
  const short_summary = removeMarkTags(
    briefing_video.summary_data.short_summary
  );
  return (
    <Container onClick={handleNavigate}>
      <CardHeader>
        {/* <IconWrapper>
          <IconBox>{icon}</IconBox>
          {section === "뷰티/메이크업" ? (
            <span>
              뷰티/ <br /> 메이크업
            </span>
          ) : (
            <span>{section}</span>
          )}
        </IconWrapper> */}
        <Section>#{category}</Section>
        <Title>
          {briefing_video.summary_data.headline_title},{" "}
          {briefing_video.summary_data.headline_sub_title}
        </Title>
      </CardHeader>
      <Body>
        <Summary>
          <p>{short_summary}</p>
        </Summary>
        <Thumbnail src={briefing_video.thumbnail} />
      </Body>
      <ChannelInfo>
        <ProfileImage src={channelThumbnail}></ProfileImage>
        <ProfileInfo>
          <Name>{channelTitle}</Name>
          <SubsUpload>
            <Subscriber>{channelSubs}</Subscriber>
            <UploadTime> {timeAgo(briefing_video.upload_date)}</UploadTime>
          </SubsUpload>
        </ProfileInfo>
      </ChannelInfo>
    </Container>
  );
};

export default ReportCard;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 12px 20px 12px;
  gap: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 1);
  margin-bottom: 20px;
  margin-top: 20px;
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
  font-size: 16px;
  font-style: italic;
  color: #30d5c8;
  font-weight: 700;
`;

const IconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;

  span {
    font-family: var(--font-Pretendard);
    font-size: 12px;
    font-weight: 500;
    line-height: 12px;
    text-align: center;
    width: 46px;
  }
`;

const Body = styled.div`
  display: flex;
  align-items: center;
`;
const IconBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #30d5c8;
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
