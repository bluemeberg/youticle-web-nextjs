"use client";

import React from "react";
import styled from "styled-components";
import { formatSummary, timeAgo } from "@/utils/formatter";
import { useRouter } from "next/navigation";
import { userAgent } from "../../../../../node_modules/next/server";

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
  isUnsubscribed: boolean;
  isNeverSubscribed: boolean;
  section: string;
  videoId: string;
  subscribedSubjects: string[];
}

const CommentsInsightSectionDimmed: React.FC<CommentsInsightProps> = ({
  data,
  isLoggedIn,
  isUnsubscribed,
  isNeverSubscribed,
  section,
  videoId,
  subscribedSubjects,
}) => {
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
  const router = useRouter();
  const subscribedText = subscribedSubjects.join(", ");

  const handleButtonClick = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "comment_subscribe_button_click", {
        event_category: "engagement",
        event_label: "Subscribe Button",
        value: 1,
      });
    }

    console.log("test");

    // section 값을 쿼리 파라미터로 전달
    const targetUrl =
      isUnsubscribed && !isNeverSubscribed
        ? `/subject/modify?section=${section}`
        : `/subject?section=${section}&videoId=${videoId}`;

    router.push(targetUrl);
  };

  return (
    <Wrapper>
      <SectionTitle>💡 AI 댓글 요약</SectionTitle>
      <Description>정확도는 영상·댓글에 따라 달라질 수 있습니다.</Description>

      {/* 1) 첫 부분만 공개: 1st summary + 첫번째 댓글 */}
      <CommentHighlight>
        <SummaryText>{formatSummary(firstSummary)}</SummaryText>
        {firstComments.map((c, idx) => (
          <CommentItem key={idx}>
            <CommentContent>{c.comment}</CommentContent>
            <SubInfo>
              <span>👍 {c.likeCount}</span>
              <span>|</span>
              <span>{timeAgo(c.updatedAt)}</span>
            </SubInfo>
          </CommentItem>
        ))}
        <SummarySecondText>{formatSummary(secondSummary)}</SummarySecondText>
        <DimmedWrapper>
          {/* {firstComments.slice(1).map((c, idx) => (
            <CommentItem key={idx}>
              <CommentContent>{c.comment}</CommentContent>
              <SubInfo>
                <span>👍 {c.likeCount}</span>
                <span>{timeAgo(c.updatedAt)}</span>
              </SubInfo>
            </CommentItem>
          ))} */}
          {/* <SummaryText>{formatSummary(secondSummary)}</SummaryText> */}
          {/* <SummaryDimmedText>{formatSummary(firstSummary)}</SummaryDimmedText> */}
          {secondComments.map((c, idx) => (
            <CommentItem key={idx}>
              <CommentContent>{c.comment}</CommentContent>
              <SubInfo>
                <span>👍 {c.likeCount}</span>
                <span>|</span>
                <span>{timeAgo(c.updatedAt)}</span>
              </SubInfo>
            </CommentItem>
          ))}
          <SummaryDimmedText>{formatSummary(firstSummary)}</SummaryDimmedText>
          {thirdComments.map((c, idx) => (
            <CommentItem key={idx}>
              <CommentContent>{c.comment}</CommentContent>
              <SubInfo>
                <span>👍 {c.likeCount}</span>
                <span>*</span>
                <span>{timeAgo(c.updatedAt)}</span>
              </SubInfo>
            </CommentItem>
          ))}
          <DimmedOverlay>
            {isLoggedIn && isNeverSubscribed ? (
              <>
                <DimmedMessage>
                  🚫 구독중인 키워드가 없습니다. <br />
                </DimmedMessage>
                <DimmeHookMessage>
                  시청자의 핵심 인사이트를 모두 보려면 <br /> {section} 키워드
                  구독이 필요합니다!
                </DimmeHookMessage>
                <SubscribeButton onClick={handleButtonClick}>
                  {section} 키워드 무료 구독하러가기
                </SubscribeButton>
              </>
            ) : isLoggedIn && isUnsubscribed ? (
              <>
                {" "}
                <DimmedMessage>
                  🙋이미 {subscribedText} <br />
                  키워드를 구독중입니다.
                </DimmedMessage>
                <DimmeHookMessage>
                  {section} 관련 아티클의 시청자 인사이트를 <br />
                  모두 보려면 키워드 변경이 필요합니다!
                </DimmeHookMessage>
                <SubscribeChangeButton onClick={handleButtonClick}>
                  구독 키워드 변경하기
                </SubscribeChangeButton>
              </>
            ) : (
              <>
                <LogoTitle>유튜브를 읽다, YouTicle</LogoTitle>
                <DimmedMessage>
                  시청자들의 반응이 궁금하다면?🤔
                  <br />
                  <br />이 영상에 달린 수십 개의 댓글 속에서 <br />
                  <em>예상치 못한 의견</em>부터 <br />{" "}
                  <em>{section} 관련 꿀팁</em>까지 숨어 있어요👀
                </DimmedMessage>
                <DimmeHookMessage>
                  {section} 키워드 무료 구독으로 <br /> 댓글 전문 열람과 추가
                  인사이트를 <br />
                  확인해보세요!👇
                </DimmeHookMessage>
                {/* <DimmeHookMessage>
                  💡 초기 무료 구독자에게만 제공되는 혜택 <br />
                  <DimmedSubMessage>
                    1️⃣ 매일 구독한 키워드의 YouTicle 뉴스레터 제공! <br />
                    2️⃣ 시청자 인사이트, 아티클 전문 열람 가능! <br />
                    3️⃣ 내 관심 키워드 최대 3개 구독 가능!
                  </DimmedSubMessage>
                </DimmeHookMessage> */}
                <SubscribeButton onClick={handleButtonClick}>
                  {section} 키워드 무료 구독하러가기
                </SubscribeButton>
              </>
            )}
          </DimmedOverlay>
        </DimmedWrapper>
      </CommentHighlight>

      {/* 2) DimmedWrapper: 
          - 1st의 나머지 댓글 + 2nd + 3rd 영역을 하나로 감싸 
          - isLoggedIn=false => Blur + "구독 필요" 메시지 
      */}
    </Wrapper>
  );
};

export default CommentsInsightSectionDimmed;

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

const SummaryDimmedText = styled.div`
  color: #777;
  backdrop-filter: blur(8px);
  background-color: #eef2ff;
  font-size: 15px;
  padding: 10px;

  margin-bottom: 12px;
`;

const SummaryText = styled.div`
  color: #000;
  font-size: 16px;
  margin-bottom: 12px;
  line-height: 1.3;
  margin-top: 8px;
`;
const SummarySecondText = styled.div`
  color: #000;
  font-size: 16px;
  margin-bottom: 12px;
  line-height: 1.3;
  margin-top: 32px;
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
  justify-content: space-between;
  span {
    margin-right: 6px;
  }
`;

/** (A) DimmedWrapper: 블러/그라데이션/마스크 처리 */
const DimmedWrapper = styled.div`
  position: relative;
  /* border-radius: 12px; */
  /* mask-image: linear-gradient(to bottom, #000 60%, transparent 95%);
  mask-size: 100% 100%; */
  mask-repeat: no-repeat;
  overflow: hidden;
  min-height: 440px;
`;

/** (B) DimmedOverlay: 하단 오버레이 + 구독 안내 버튼 */
const DimmedOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0px;
  background-color: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  /* ✅ 마스크 효과로 부드러운 페이드 처리 */
  mask-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 1)
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 1)
  );

  /* text-align: center; */
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
`;
const LogoTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 32px;
  font-family: "Pretendard Variable";
`;

const DimmedMessage = styled.div`
  font-size: 16px;
  margin-bottom: 32px;
  line-height: 132%;
  font-weight: 500;
  width: 100%;
  padding-left: 20px;
  padding-right: 20px;
  text-align: center;
  /* 예상치 못한 의견과 주식 관련 꿀팁 부분 italic 적용 */
  em {
    font-style: italic;
    font-weight: 700;
  }
`;

const DimmeHookMessage = styled.div`
  font-size: 16px;
  margin-bottom: 20px;
  line-height: 132%;
  font-weight: 500;
  width: 100%;
  padding-left: 20px;
  padding-right: 20px;
  text-align: center;
`;

const SubscribeButton = styled.button`
  background-color: #007bff;
  color: #fff;
  width: 80%;
  /* height: 52px; */
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  margin-top: 8px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const SubscribeChangeButton = styled.button`
  background-color: #000;
  color: #fff;
  width: 88%;
  height: 52px;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  margin-top: 8px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const DimmedSubMessage = styled.div`
  font-size: 14px;
  font-weight: 400;
  margin-top: 8px;
  text-align: left;
`;

const SmallDesc = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #555;
`;

const UnSubscribeContainer = styled.div`
  background-color: #e9f4ff;
  padding: 28px 24px 8px 24px;
  border-radius: 4px;
`;

const ServiceSubTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ServiceSubTitleSubContainer = styled.div`
  display: flex;
  flex-direction: column;
  div:first-child {
    margin-bottom: 12px;
    margin-top: 4px;
    min-width: 92px;
  }
  div:nth-child(2) {
    margin-bottom: 32px;
  }
`;
const ServiceSubTitleIcon = styled.div`
  font-size: 18px;
  font-weight: 700;
`;

const ServiceSubTitleDescription = styled.div`
  font-size: 16px;
  line-height: 132%;
  ul {
    margin: 0;
    padding-left: 20px;
    list-style-type: disc;
    margin-top: 12px;
  }

  li {
    margin-bottom: 8px;
    font-size: 14px;
  }
  strong {
    font-weight: 600;
  }
`;
