// MarketInsightSection.tsx
"use client";

import styled from "styled-components";
import MarketInsightCard from "./MarketInsightCard";
import type { MarketInsightCardData } from "@/utils/marketInsight";

interface MarketInsightSectionProps {
  title?: string;
  cards: MarketInsightCardData[];
}

const EMPTY_MESSAGE = "마켓 데이터가 없습니다.";

const MarketInsightSection = ({ title = "📰 마켓 인사이트", cards }: MarketInsightSectionProps) => {
  const hasData = cards.length > 0;
  const firstAsOf = hasData ? cards[0].asofText : "";
  const allSameAsOf = hasData ? cards.every(c => c.asofText === firstAsOf) : true;

  return (
    <Section>
      <Header>
        <SectionTitleRow>
          <SectionTitle>{title}</SectionTitle>
          {firstAsOf && allSameAsOf && <AsOfBadge>{firstAsOf}</AsOfBadge>}
        </SectionTitleRow>
      </Header>

      {hasData ? (
        cards.map((card) => (
          <MarketInsightCard
            key={card.marketKey ?? `${card.market}-${card.asofText}-${card.deltaText}`}
            data={{ ...card, showAsOfInCard: !allSameAsOf }} // ⬅ 카드에선 숨길지 여부 전달
          />
        ))
      ) : (
        <Empty>{EMPTY_MESSAGE}</Empty>
      )}
    </Section>
  );
};

export default MarketInsightSection;

const Section = styled.section`
  margin: 24px 8px;
`;

const Header = styled.div`
  margin-bottom: 10px;
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  display: inline-block;
  margin: 0;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 800;
  background: #eaf2ff;
  color: #0b63f6;
`;

const AsOfBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 12px;
  color: #334155;
  background: #f8fafc;
`;

const Empty = styled.div`
  color: #64748b;
  font-size: 13px;
  padding: 12px;
  text-align: center;
`;
