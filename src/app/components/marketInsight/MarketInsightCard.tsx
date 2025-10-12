// MarketInsightCard.tsx
"use client";

import styled from "styled-components";
import type { MarketInsightCardData } from "@/utils/marketInsight";

interface MarketInsightCardProps {
  data: MarketInsightCardData & { showAsOfInCard?: boolean };
}

const MarketInsightCard = ({ data }: MarketInsightCardProps) => {
  const { summaryItems } = data;

  return (
    <Card role="article" aria-label={`${data.market} 마켓 인사이트`}>
      <Header>
        <Title>
          {data.market} <Price>{data.price}</Price>
        </Title>
        <DeltaChip $color={data.deltaColor}>{data.deltaText}</DeltaChip>
      </Header>

      {data.showAsOfInCard && data.asofText && (
        <BadgeRow>
          <Badge aria-label="기준 시각">{data.asofText}</Badge>
        </BadgeRow>
      )}

      {summaryItems.length > 0 && (
        <SummaryBlock>
          <SummaryBadge>핵심 요약</SummaryBadge>
          <SummaryList>
            {summaryItems.map((item) => (
              <SummaryItem key={item.index}>
                <SummaryLabel>
                  {item.index}. {item.title} :
                </SummaryLabel>
                <SummaryContent
                  // 요약 문장 내부 <b>…</b> 강조는 허용
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </SummaryItem>
            ))}
          </SummaryList>
        </SummaryBlock>
      )}

      <CommentBlock>
        <CommentTitle>{data.commentTitle}</CommentTitle>
        <CommentBody
          dangerouslySetInnerHTML={{ __html: data.commentBodyHtml }}
        />
      </CommentBlock>
    </Card>
  );
};

export default MarketInsightCard;

const Card = styled.div`
  padding: 14px;
  border: 1px solid #e6eef9;
  border-radius: 12px;
  background: #ffffff;
  margin-bottom: 12px;
  font-family: "Pretendard Variable", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
`;

const Title = styled.div`
  font-weight: 800;
  font-size: 16px;
  color: #0f172a;
`;

const Price = styled.span`
  margin-left: 4px;
  color: #6b7280;
  font-weight: 700;
`;

const DeltaChip = styled.span<{ $color: string }>`
  font-weight: 800;
  font-size: 14px;
  color: ${({ $color }) => $color};
  padding: 2px 8px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
`;

const BadgeRow = styled.div`
  margin: 4px 0 10px 0;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 12px;
  color: #334155;
  background: #f8fafc;
`;

const SummaryBlock = styled.div`
  margin-top: 4px;
  background: #fff;
  border-radius: 10px;
`;

const SummaryBadge = styled.div`
  display: inline-block;
  background: #eef2ff;
  color: #0a58ca;
  font-weight: 700;
  font-size: 12px;
  border-radius: 999px;
  padding: 3px 8px;
  line-height: 1;
  margin-bottom: 6px;
`;

const SummaryList = styled.div`
  display: grid;
  gap: 6px;
`;

const SummaryItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 6px;
  align-items: start;
`;

const SummaryLabel = styled.div`
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
`;

const SummaryContent = styled.div`
  color: #1f2937;
  line-height: 1.6;
  word-break: keep-all;
`;

const CommentBlock = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #0f172a;
  background: #f8fafc;
`;

const CommentTitle = styled.div`
  font-weight: 800;
  margin-bottom: 6px;
  color: #0b63f6;
`;

const CommentBody = styled.div`
  color: #1f2937;
  word-break: keep-all;
`;
