// components/overviews/TravelOverviewUnified.tsx
import React from "react";
import styled from "styled-components";

interface TravelItem {
  place_type: string;
  place_name: string;
  cost_info: string;
  key_features: string;
  how_to_go: string;
  tips: string;
}

interface TravelOverviewUnifiedProps {
  overview: {
    travel_items?: TravelItem[]; // 🔹 travel_items가 undefined일 수 있음
  };
}

const TravelOverviewUnified: React.FC<TravelOverviewUnifiedProps> = ({
  overview,
}) => {
  const { travel_items = [] } = overview; // 🔹 undefined 방지
  console.log(travel_items);
  if (travel_items.length === 0) {
    return (
      <Container>
        <Title>✈️ 유티클 간편 여행 가이드</Title>
        <p>영상에서 여행 관련 정보가 충분히 제공되지 않았습니다.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>✈️ 유티클 간편 여행 가이드</Title>

      {travel_items.map((item, index) => (
        <ItemCard key={index}>
          <ItemHeader>
            <PlaceType>[{item.place_type}]</PlaceType>
            <PlaceName>{item.place_name}</PlaceName>
          </ItemHeader>
          {item.cost_info && (
            <InfoBlock>
              <Label>💰 비용:</Label>
              <Value>{item.cost_info}</Value>
            </InfoBlock>
          )}
          {item.key_features && (
            <InfoBlock>
              <Label>📌 특징:</Label>
              <Value>{item.key_features}</Value>
            </InfoBlock>
          )}
          {item.how_to_go && (
            <InfoBlock>
              <Label>🚍 가는 방법:</Label>
              <Value>{item.how_to_go}</Value>
            </InfoBlock>
          )}
          {item.tips && (
            <InfoBlock>
              <Label>💡 Tips:</Label>
              <Value>{item.tips}</Value>
            </InfoBlock>
          )}
        </ItemCard>
      ))}
    </Container>
  );
};

export default TravelOverviewUnified;

// Styled Components
const Container = styled.div`
  padding: 0 16px;
  margin-top: 80px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
`;

const ItemCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const ItemHeader = styled.div`
  display: flex;
  /* align-items: center; */
  gap: 6px; /* 기존 margin-right 대체 */
  margin-bottom: 12px;
`;

const PlaceType = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #007bff;
  min-width: 70px;
`;

const PlaceName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
`;

const InfoBlock = styled.div`
  display: flex;
  align-items: flex-start; /* 여러 줄일 경우 위쪽 정렬 */
  margin-top: 6px;
  gap: 8px; /* Label과 Value 사이 여백 */
`;

const Label = styled.div`
  min-width: 70px; /* 기존보다 조금 작게 조정 */
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0; /* Label이 너무 작아지지 않도록 */
`;

const Value = styled.div`
  font-size: 14px;
  color: #555;
  flex-grow: 1; /* 내용이 많아도 잘 확장되도록 */
  word-break: keep-all; /* 긴 텍스트 줄바꿈 */
  line-height: 1.4;
`;
