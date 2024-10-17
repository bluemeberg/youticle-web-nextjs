"use client"; // 클라이언트 컴포넌트임을 명시

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useSetRecoilState } from "recoil";
import { detailDataState } from "@/store/detailData";
import { DataProps } from "@/types/dataProps";
import {
  parseSubscribersCount,
  timeSinceUpload,
  removeMarkTags,
  timeAgo,
  parseVideoCountcribersCount,
} from "@/utils/formatter";
import LikeIcon from "@/assets/like_icon.svg";
import ViewIcon from "@/assets/view_icon.svg";

interface TopicCardProps extends DataProps {
  icon: React.ReactNode;
}

const TopicCard = (props: TopicCardProps) => {
  const router = useRouter();
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
    setTopicState(props);
    router.push(`/detail/${video_id}`);
  };
  const short_summary = removeMarkTags(summary_data.short_summary);
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
        <Section>#{section}</Section>
        <Title>
          {summary_data.headline_title}, {summary_data.headline_sub_title}
        </Title>
      </CardHeader>
      <BodyContainer>
        <ChannelInfoContainer>
          <Thumbnail src={thumbnail} />
          <VideoInfo>
            <ViewIcon /> <span>{parseVideoCountcribersCount(views)}</span>
            <LikeIcon /> <span>{parseVideoCountcribersCount(likes)}</span>
          </VideoInfo>
          <ChannelInfo>
            <ProfileImage
              src={channel_details.channel_thumbnail}
            ></ProfileImage>
            <ProfileInfo>
              <Name>{channel_details.channel_name}</Name>
              <SubsUpload>
                <Subscriber>
                  {parseSubscribersCount(channel_details.channel_subscribers)}
                </Subscriber>
                <UploadTime> {timeAgo(upload_date)}</UploadTime>
              </SubsUpload>
            </ProfileInfo>
          </ChannelInfo>
        </ChannelInfoContainer>
        <Body>
          <Summary>
            <p>{summary_data.short_summary}</p>
          </Summary>
        </Body>
      </BodyContainer>
    </Container>
  );
};

export default TopicCard;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 12px 20px 12px;
  gap: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 1);
  margin-bottom: 20px;
  border-bottom: 1px solid #d9d9d9;
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
`;

const BodyContainer = styled.div`
  display: flex;
`;

const SubsUpload = styled.div`
  display: flex;
`;

const Section = styled.div`
  font-size: 16px;
  color: #007bff;
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
  max-width: 200px;
  min-width: 200px;
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

const SummaryContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;
const Divider = styled.div`
  height: 28px;
  min-width: 2px;
  background-color: #000;
`;

const SummaryConetent = styled.div`
  margin-left: 4px;
  font-size: 16px;
  line-height: 120%;
`;

const Summary = styled.div`
  border-radius: 4px;
  margin-left: 12px;
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
  width: 100%;
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
  font-size: 14px;
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
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  height: 36px;
  margin-top: 12px;
  flex-direction: row;
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
  display: inline-block;
  max-width: 132px; // 적절한 너비 설정 (10글자를 넘지 않도록)
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subscriber = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
  margin-right: 8px;
`;
