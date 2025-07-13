import React from "react";
import styled from "styled-components";
import {
  parseSubscribersCount,
  timeAgo,
  removeMarkTags,
  parseVideoCountcribersCount,
} from "@/utils/formatter";
interface VideoCardProps {
  thumbnail: string;
  title: string;
  channelName: string;
  subscriber: number;
  upload_date: string;
  description: string;
  channel_thumbnail: string;
}

const VideoCard = ({
  thumbnail,
  title,
  channelName,
  subscriber,
  upload_date,
  description,
  channel_thumbnail,
}: VideoCardProps) => {
  return (
    <CardContainer>
      <SourceText>📌 출처</SourceText>
      <ContentContainer>
        <VideoTitle>{title}</VideoTitle>
        <Thumbnail src={thumbnail} alt="Video Thumbnail" />
      </ContentContainer>
      <InfoContainer>
        <ProfileImage src={channel_thumbnail} />
        <ChannelInfo>
          <ChannelName>{channelName}</ChannelName>
          <MetaData>
            {parseSubscribersCount(subscriber)} · {timeAgo(upload_date)}
          </MetaData>
        </ChannelInfo>
      </InfoContainer>
      <DescriptionBubble>{removeMarkTags(description)}</DescriptionBubble>
    </CardContainer>
  );
};

export default VideoCard;

// Styled Components
const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-width: 400px;
  background: #fff;
  margin: 16px;
`;

const SourceText = styled.div`
  font-size: 14px;
  color: #808080;
`;

const VideoTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
  line-height: 1.4;
  color: #000;
  display: -webkit-box;
  -webkit-line-clamp: 4; /* 최대 4줄 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProfileImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(217, 217, 217, 1);
`;

const ContentContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const Thumbnail = styled.img`
  object-fit: cover;
  border-radius: 4px;
  height: auto;
  aspect-ratio: 132 / 72;
  max-width: 44%;
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const ChannelInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
`;

const ChannelName = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #000;
`;

const MetaData = styled.div`
  font-size: 12px;
  color: #808080;
`;

const InfoIcon = styled.div`
  font-size: 16px;
  color: #007bff;
  cursor: pointer;
  align-self: flex-start;
`;

const DescriptionBubble = styled.div`
  margin-top: 8px;
  padding: 12px;
  background: #f9fafc;
  border: 1px solid #c4c4c4;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  position: relative;

  &:before {
    content: "";
    position: absolute;
    top: -10px;
    left: 20px;
    border-width: 0 10px 10px;
    border-style: solid;
    border-color: transparent transparent #c4c4c4 transparent;
  }

  &:after {
    content: "";
    position: absolute;
    top: -9px;
    left: 20px;
    border-width: 0 9px 9px;
    border-style: solid;
    border-color: transparent transparent #f9fafc transparent;
  }
`;
