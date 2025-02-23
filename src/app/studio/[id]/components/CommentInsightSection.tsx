import React from "react";
import styled from "styled-components";
import { formatSummary, removeMarkTags } from "@/utils/formatter";

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
  isLoggedIn: boolean; // 로그인 여부
}

const CommentsInsightSection: React.FC<CommentsInsightProps> = ({
  data,
  isLoggedIn,
}) => {
  const renderSection = (titleKey: "1st" | "2nd" | "3rd") => {
    const text = data[titleKey];
    const commentsKey = `${titleKey}_comments` as keyof RecommendData;
    const comments = data[commentsKey] as CommentObj[];

    return (
      <SectionBlock>
        {/* 🔹 기존에는 CommentHighlight가 단독 블록이었지만, CommentList를 포함하는 구조로 변경 */}
        <CommentHighlight>
          {!isLoggedIn ? (
            <BlurredText>{formatSummary(text)}</BlurredText>
          ) : (
            <NormalText>{formatSummary(text)}</NormalText>
          )}

          {/* 🔥 수정: 이제 CommentList가 CommentHighlight 내부에 포함됨 */}
          <CommentList>
            {comments.map((item, idx) => (
              <CommentItem key={idx}>
                <CommentContent>{item.comment}</CommentContent>
                <SubInfo>
                  <span>👍 {item.likeCount}</span>
                  <span>{item.updatedAt}</span>
                </SubInfo>
              </CommentItem>
            ))}
          </CommentList>
        </CommentHighlight>
      </SectionBlock>
    );
  };

  return (
    <Wrapper>
      <SectionTitle>💡 AI 댓글 요약</SectionTitle>
      <Description>경우에 따라 정확도가 다를 수 있습니다.</Description>
      {renderSection("1st")}
      {renderSection("2nd")}
      {renderSection("3rd")}
    </Wrapper>
  );
};

export default CommentsInsightSection;

/* 🔹 스타일 */
const Wrapper = styled.div`
  background-color: #fff;
  /* border-top: 1px solid #ddd; */
  padding: 20px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
`;

const Description = styled.p`
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
  margin-top: 4px;
`;

const SectionBlock = styled.div`
  margin-bottom: 16px;
`;

const CommentHighlight = styled.div`
  padding: 20px 16px;
  background-color: #eef2ff;
  /* border-radius: 8px; */
  margin-bottom: 12px; /* 🔹 요약과 댓글 그룹 간격 */
`;

const BlurredText = styled.div`
  color: transparent;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.7);
  background: repeating-linear-gradient(
    -45deg,
    #f8f8f8,
    #f8f8f8 10px,
    #f0f0f0 10px,
    #f0f0f0 20px
  );
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
`;

const NormalText = styled.div`
  font-size: 16px;
  line-height: 1.3;
`;

const CommentList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 16px; /* 🔹 요약문과 댓글 간격 조정 */
`;

const CommentCard = styled.li`
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px;
  margin-top: 8px;
`;

const CommentContent = styled.div`
  font-size: 14px;
  line-height: 1.3;
`;

const SubInfo = styled.div`
  font-size: 12px;
  color: #777;
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
`;
const CommentItem = styled.li`
  background: #ffffff;
  border: 1px solid #ddd;
  /* border-radius: 6px; */
  padding: 10px;
  margin-top: 6px;
`;
