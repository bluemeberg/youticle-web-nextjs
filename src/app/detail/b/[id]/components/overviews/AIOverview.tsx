// components/overviews/AiOverviewExtended.tsx
import React from "react";
import styled from "styled-components";

interface TargetAudience {
  label: string;
  description: string;
}

interface AiTrend {
  trend_name: string;
  trend_description: string;
}

interface UsageTip {
  tip_title: string;
  tip_description: string;
}

interface RelatedTech {
  technology_name: string;
  technology_description: string;
  usage_tips: UsageTip[];
}

interface AiOverviewExtendedProps {
  overview: {
    target_audience?: TargetAudience[];
    ai_trends?: AiTrend[];
    related_technologies?: RelatedTech[];
  };
}

const AiOverviewExtended: React.FC<AiOverviewExtendedProps> = ({
  overview,
}) => {
  return (
    <Container>
      <Title>✨ 유티클 인사이트</Title>

      {/* (A) 타겟 오디언스 */}
      {overview.target_audience && overview.target_audience.length > 0 && (
        <Section>
          <SectionTitle>누가 보면 좋을까요?</SectionTitle>
          <SectionDesc>
            이 영상에서 소개된 AI 정보가 특히 유용한 대상입니다.
          </SectionDesc>

          {overview.target_audience.map((aud, idx) => (
            <AudienceBlock key={idx}>
              <AudienceLabel>{aud.label}</AudienceLabel>
              <AudienceDesc>{aud.description}</AudienceDesc>
            </AudienceBlock>
          ))}
        </Section>
      )}

      {/* (B) AI 트렌드 */}
      {overview.ai_trends && overview.ai_trends.length > 0 && (
        <Section>
          <SectionTitle>AI 트렌드</SectionTitle>
          <SectionDesc>
            영상을 통해 주목받은 최신 AI 흐름을 간단히 정리했어요.
          </SectionDesc>

          {overview.ai_trends.map((trend, idx) => (
            <TrendBlock key={idx}>
              <TrendName>{trend.trend_name}</TrendName>
              <TrendDesc>{trend.trend_description}</TrendDesc>
            </TrendBlock>
          ))}
        </Section>
      )}

      {/* (C) 관련 기술 */}
      {overview.related_technologies &&
        overview.related_technologies.length > 0 && (
          <Section>
            <SectionTitle>관련 기술</SectionTitle>
            <SectionDesc>
              영상에서 언급된 주요 AI 도구 및 기술을 살펴봅니다.
            </SectionDesc>

            {overview.related_technologies.map((tech, idx) => (
              <TechBlock key={idx}>
                <TechName>{tech.technology_name}</TechName>
                <TechDesc>{tech.technology_description}</TechDesc>

                {tech.usage_tips.length > 0 && (
                  <>
                    <TipsHeader>사용 팁</TipsHeader>
                    {tech.usage_tips.map((tip, tIdx) => (
                      <TipItem key={tIdx}>
                        <TipTitle>{tip.tip_title}</TipTitle>
                        <TipDesc>{tip.tip_description}</TipDesc>
                      </TipItem>
                    ))}
                  </>
                )}
              </TechBlock>
            ))}
          </Section>
        )}
    </Container>
  );
};

export default AiOverviewExtended;

/* ===== Styled ===== */
const Container = styled.div`
  padding: 0 16px;
  margin-top: 80px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
`;

const Section = styled.div`
  margin-bottom: 36px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const SectionDesc = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.4;
`;

/* target_audience */
const AudienceBlock = styled.div`
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
`;
const AudienceLabel = styled.h4`
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
`;
const AudienceDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 1.4;
`;

/* ai_trends */
const TrendBlock = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;
const TrendName = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;
const TrendDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 1.4;
`;

/* related_technologies */
const TechBlock = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;
const TechName = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
`;
const TechDesc = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const TipsHeader = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const TipItem = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
`;

const TipTitle = styled.h5`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;
const TipDesc = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 1.4;
`;
