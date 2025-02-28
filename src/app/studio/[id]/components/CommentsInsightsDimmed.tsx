"use client";

import React from "react";
import styled from "styled-components";
import { formatSummary, timeAgo } from "@/utils/formatter";

interface CommentObj {
  comment: string;
  likeCount: string;
  updatedAt: string;
}

interface RecommendData {
  "1st": string;
  "1st_comments": CommentObj[];
  "2nd": string;
  "2nd_comments": CommentObj[];
  "3rd": string;
  "3rd_comments": CommentObj[];
}

interface CommentsInsightProps {
  data: RecommendData;
  isLoggedIn: boolean; // 로그인(또는 구독) 여부
}

const CommentsInsightSection: React.FC<CommentsInsightProps> = ({
  data,
  isLoggedIn,
}) => {
  console.log(data);
  // (A) 첫 번째 섹션
  const firstSummary = data["1st"];
  const firstComments = data["1st_comments"] || [];
  // 첫 댓글만 완전 공개
  const firstComment = firstComments[0];
  const restFirstComments = firstComments.slice(1);

  // (B) 2nd 섹션
  const secondSummary = data["2nd"];
  const secondComments = data["2nd_comments"] || [];

  // (C) 3rd 섹션
  const thirdSummary = data["3rd"];
  const thirdComments = data["3rd_comments"] || [];

  return (
    <Wrapper>
      <SectionTitle>💡 AI 댓글 요약</SectionTitle>
      <Description>정확도는 영상·댓글에 따라 달라질 수 있습니다.</Description>

      {/* 1) 첫 부분만 공개: 1st summary + 첫번째 댓글 */}
      <CommentHighlight>
        <SummaryText>{formatSummary(firstSummary)}</SummaryText>
        {firstComments && (
          <CommentItem>
            <CommentContent>{firstComment.comment}</CommentContent>
            <SubInfo>
              <span>👍 {firstComment.likeCount}</span>
              <span>|</span>
              <span>{timeAgo(firstComment.updatedAt)}</span>
            </SubInfo>
          </CommentItem>
        )}
        <DimmedWrapper $dimmed={!isLoggedIn}>
          {firstComments.slice(1).map((c, idx) => (
            <CommentItem key={idx}>
              <CommentContent>{c.comment}</CommentContent>
              <SubInfo>
                <span>👍 {c.likeCount}</span>
                <span>|</span>

                <span>{timeAgo(c.updatedAt)}</span>
              </SubInfo>
            </CommentItem>
          ))}
          {/* <SummaryText>{formatSummary(secondSummary)}</SummaryText> */}
          <SummaryText>{formatSummary(firstSummary)}</SummaryText>
          {secondComments.map((c, idx) => (
            <CommentItem key={idx}>
              <CommentContent>{c.comment}</CommentContent>
              <SubInfo>
                <span>👍 {c.likeCount}</span>
                <span>{timeAgo(c.updatedAt)}</span>
              </SubInfo>
            </CommentItem>
          ))}
          {!isLoggedIn && (
            <DimmedOverlay>
              <DimmedMessage>
                더 많은 댓글과 인사이트를 보려면 <strong>키워드 구독</strong>이
                필요해요!
              </DimmedMessage>
              <SubscribeButton>지금 구독하기</SubscribeButton>
            </DimmedOverlay>
          )}
        </DimmedWrapper>
      </CommentHighlight>

      {/* 2) DimmedWrapper: 
          - 1st의 나머지 댓글 + 2nd + 3rd 영역을 하나로 감싸 
          - isLoggedIn=false => Blur + "구독 필요" 메시지 
      */}
    </Wrapper>
  );
};

export default CommentsInsightSection;

/* =================== Styled =================== */
const Wrapper = styled.div`
  background-color: #fff;
  padding: 20px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
`;

const CommentHighlight = styled.div`
  padding: 16px;
  background-color: #eef2ff;
  margin-bottom: 12px;
`;

const SummaryText = styled.div`
  color: #777;
  backdrop-filter: blur(8px);
  background-color: #eef2ff;
  font-size: 15px;
  padding: 10px;

  margin-bottom: 12px;
`;

const CommentItem = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  padding: 16px;
  margin-bottom: 6px;
`;

const CommentContent = styled.div`
  font-size: 14px;
  line-height: 1.3;
`;

const SubInfo = styled.div`
  font-size: 12px;
  color: #777;
  margin-top: 6px;
  span {
    margin-right: 12px;
  }
`;

/** (A) DimmedWrapper: 블러/그라데이션/마스크 처리 */
const DimmedWrapper = styled.div<{ $dimmed: boolean }>`
  position: relative;

  /* 로그인 안되어 있으면 mask / blur 효과 */
  ${({ $dimmed }) =>
    $dimmed &&
    `
     mask-image: linear-gradient(to bottom, #000 60%, transparent 95%);
     mask-size: 100% 100%;
     mask-repeat: no-repeat;
     overflow: hidden;
  `}
`;

/** (B) DimmedOverlay: 하단 오버레이 + 구독 안내 버튼 */
const DimmedOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0px;
  padding: 24px;
  /* background-color: rgba(255, 255, 255, 0.85); */
  backdrop-filter: blur(8px);
  text-align: center;
`;

const DimmedMessage = styled.div`
  font-size: 14px;
  margin-bottom: 12px;
`;

const SubscribeButton = styled.button`
  background-color: #007bff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;
