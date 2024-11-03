"use client"; // 클라이언트 컴포넌트임을 명시

import { useRouter } from "next/navigation";
import styled from "styled-components";
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
  const short_summary = removeMarkTags(summary_data?.short_summary || "");
  const specialSections = ["주식"]; // 특정 주제 섹션 목록

  // 해당 섹션이 특정 주제인지 확인
  const isSpecialSection = specialSections.includes(section);
  return (
    <Container onClick={handleNavigate}>
      <CardHeader>
        <Section>#{section}</Section>
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
        <ChannelInfoContainer>
          <Thumbnail src={thumbnail} />
          <VideoInfo>
            <ViewIcon /> <span>{parseVideoCountcribersCount(views)}</span>
            <LikeIcon /> <span>{parseVideoCountcribersCount(likes)}</span>
          </VideoInfo>
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
        </ChannelInfoContainer>
        <Body>
          {isSpecialSection ? (
            <Summary>
              {summary_data?.key_points?.length ? (
                summary_data.key_points.map((point, index) => (
                  <SummaryContainer key={index}>
                    <Divider height={"6px"} />
                    <SummaryContent fontSize={`16px`}>
                      {point.point}
                    </SummaryContent>
                  </SummaryContainer>
                ))
              ) : summary_data?.headline_sub_title === "" ? (
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
              {summary_data?.key_points?.length ? (
                summary_data.key_points.map((point, index) => (
                  <SummaryContainer key={index}>
                    <Divider height={"6px"} />
                    <SummaryContent fontSize={`16px`}>
                      {point.point}
                    </SummaryContent>
                  </SummaryContainer>
                ))
              ) : (
                <ShortSummary>{short_summary}</ShortSummary>
              )}
            </Summary>
          )}
        </Body>
      </BodyContainer>
    </Container>
  );
};

export default TopicCard;

// 스타일 정의
const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  gap: 10px;
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

const ShortSummary = styled.div`
  font-size: 14px;
  line-height: 132%;
  display: -webkit-box;
  -webkit-line-clamp: 6; /* 최대 5줄 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BodyContainer = styled.div`
  display: flex;
  width: 100%;
`;

const SubsUpload = styled.div`
  display: flex;
`;

const Section = styled.div`
  font-size: 16px;
  color: #007bff;
  font-weight: 700;
`;

const Body = styled.div`
  display: flex;
  max-width: 60%; /* Body 영역을 60%로 설정 */
  min-width: 60%;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
`;

const BodyTitle = styled.span`
  font-size: 18px;
  font-weight: 700;
  line-height: 28px;
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
  margin-left: 12px;
`;

const Thumbnail = styled.img`
  object-fit: cover;
  border-radius: 4px;
  width: 100%;
  height: auto;
  aspect-ratio: 132 / 72;
`;

const UploadTime = styled.span`
  font-size: 12px;
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
`;

const ProfileImage = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(217, 217, 217, 1);
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Name = styled.span`
  font-size: 12px;
  line-height: 128%;
  display: inline-block;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subscriber = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 16.8px;
  color: #696868;
  margin-right: 8px;
`;
