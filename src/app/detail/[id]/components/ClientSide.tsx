"use client";

import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import YouTube, { YouTubeProps } from "react-youtube";
import { useRecoilValue, useSetRecoilState } from "recoil";
import LogoHeader from "@/common/LogoHeader";
import Contents from "./Contents";
import {
  DataProps,
  StockAnalysis,
  RealEstateAnalysis,
  RecommendedTool,
  EconomicTrend,
  MarketAnalysisEconomy,
  InvestmentStrategyEconomy,
  RelatedTechnology,
  StrategicInsight,
  BusinessTrend,
  ApplicationTip,
  RelatedTool,
} from "@/types/dataProps";
import { playerState } from "@/store/player";
import { base64ToBlobUrl } from "@/utils/base64";
import { formatSummary } from "@/utils/formatter";
import { timeAgo } from "@/utils/formatter";
import { isDesktop } from "react-device-detect";

interface ClientSideProps {
  id: string;
  detailData: DataProps;
}

const ClientSide = ({ id, detailData }: ClientSideProps) => {
  const [videoPlayer, setVideoPlayer] = useState<any>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isPlayerVisible = useRecoilValue(playerState);
  const setIsPlayerVisible = useSetRecoilState(playerState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    setVideoPlayer(event.target);
    setIsLoading(false);
  };

  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    if (!event.data) {
      const player = event.target;
      player.playVideo();
    }
  };

  const [isClientDesktop, setIsClientDesktop] = useState(false);
  useEffect(() => {
    // 클라이언트에서만 isDesktop 값을 설정
    setIsClientDesktop(isDesktop);
  }, []);

  const handleTocItemClick = (start: number) => {
    if (!isPlayerVisible) setIsPlayerVisible(true);

    if (videoPlayer) {
      videoPlayer.seekTo(start, true);
      videoPlayer.playVideo();
    }
  };

  const opts: YouTubeProps["opts"] = {
    height: "202",
    playerVars: {
      autoplay: 0,
      rel: 0,
      disablekb: 1,
    },
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollRefTop = scrollRef.current.getBoundingClientRect().top;
        setIsFixed(scrollRefTop <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();
    setIsLoading(true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchThumbnails = async () => {
      try {
        const thumbnailResponse = await fetch(
          `https://youticle.shop/briefing/capture_frames/${id}`
        );
        // const thumbnailResponse = await fetch(
        //   `http://0.0.0.0:8000/briefing/capture_frames/${id}`
        // );
        if (!thumbnailResponse.ok)
          throw new Error("Failed to fetch thumbnails");

        const thumbnailData = await thumbnailResponse.json();
        const sortedThumbnails = thumbnailData
          .sort((a: any, b: any) => {
            const numA = parseInt(a.filename.match(/\d+/)?.[0] || "0", 10);
            const numB = parseInt(b.filename.match(/\d+/)?.[0] || "0", 10);
            return numA - numB;
          })
          .map(({ content }: any) => base64ToBlobUrl(content));

        setThumbnails(sortedThumbnails);
      } catch (error) {
        console.error("Error fetching thumbnails:", error);
      }
    };

    fetchThumbnails();
  }, [id]);
  console.log(detailData);
  return (
    <Container $isFixed={isFixed}>
      <LogoHeader
        title={isFixed ? `${detailData.summary_data.headline_title}` : ""}
      />
      <PageInfo ref={scrollRef}>
        <Category>{detailData.section}</Category>
        <Title>{detailData.summary_data.headline_title}</Title>
        <UploadContainer>
          <Upload>업로드 {timeAgo(detailData.upload_date)} </Upload> *
          <Upload>{detailData.duration}</Upload>
        </UploadContainer>
      </PageInfo>
      <VideoContainer
        ref={videoContainerRef}
        $isFixed={isFixed}
        $isDesktop={isDesktop}
      >
        {isLoading && <Loader />}
        <YouTube
          videoId={id}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          style={{
            display: isLoading ? "none" : isPlayerVisible ? "block" : "none",
          }}
        />
      </VideoContainer>
      <OverviewTitle>✨ 하이라이트</OverviewTitle>

      {/* Conditionally render overview based on the section */}
      {detailData.section === "주식" && detailData.summary_data.overview && (
        <OverviewContainer>
          <SectionTitle>시장 분석</SectionTitle>
          <Description>
            이 정보는 유튜브 영상에서 제공된 시장 동향과 관련된 내용입니다.
          </Description>
          <Analysis>
            {detailData.summary_data.overview.market_analysis}
          </Analysis>
          <SectionTitle>종목 분석</SectionTitle>
          <Description>
            유튜브 영상에 소개된 주식 종목들에 대한 심층 분석입니다.
          </Description>
          {detailData.summary_data.overview.stock_analysis?.map(
            (stock: StockAnalysis, index) => (
              <StockCard key={index}>
                <StockName>{stock.stock}</StockName>
                <StockDescription>{stock.stock_description}</StockDescription>
                <StockAnalysisText>{stock.analysis}</StockAnalysisText>
              </StockCard>
            )
          )}
          <SectionTitle>투자 전략</SectionTitle>
          <Description>
            영상에서 제안된 투자 전략과 조언을 포함합니다.
          </Description>
          <Analysis>
            {detailData.summary_data.overview.investment_strategy}
          </Analysis>
        </OverviewContainer>
      )}

      {detailData.section === "부동산" && detailData.summary_data.overview && (
        <OverviewContainer>
          <SectionTitle>시장 분석</SectionTitle>
          <Description>
            이 정보는 유튜브 영상에서 제공된 시장 동향과 관련된 내용입니다.
          </Description>
          <Analysis>
            {detailData.summary_data.overview.market_analysis}
          </Analysis>
          <SectionTitle>지역 분석</SectionTitle>
          <Description>
            유튜브 영상에 소개된 지역에 대한 심층 분석입니다.
          </Description>
          {detailData.summary_data.overview.real_estate_analysis?.map(
            (real_estate: RealEstateAnalysis, index) => (
              <StockCard key={index}>
                <StockName>{real_estate.real_estate_area}</StockName>
                <StockDescription>
                  {real_estate.area_description}
                </StockDescription>
                <StockAnalysisText>{real_estate.analysis}</StockAnalysisText>
              </StockCard>
            )
          )}
          <SectionTitle>투자 전략</SectionTitle>
          <Description>
            영상에서 제안된 투자 전략과 조언을 포함합니다.
          </Description>
          <Analysis>
            {detailData.summary_data.overview.investment_strategy}
          </Analysis>
        </OverviewContainer>
      )}

      {detailData.section === "경제" && detailData.summary_data.overview && (
        <OverviewContainer>
          {/* 경제 트렌드 */}
          <SectionTitle>경제 트렌드</SectionTitle>
          <Description>
            유튜브 영상에서 언급된 경제 트렌드와 변화 요인등을 소개합니다.
          </Description>
          {detailData.summary_data.overview.economic_trends?.map(
            (trend: EconomicTrend, index) => (
              <Card key={index}>
                <TrendTitle>{trend.trend_name}</TrendTitle>
                <TrendDescription>{trend.trend_description}</TrendDescription>
              </Card>
            )
          )}

          {/* 시장 분석 */}
          <SectionTitle>시장 분석</SectionTitle>
          <Description>
            영상에 등장한 다양한 시장 지표를 바탕으로 한 경제 분석을 소개합니다.
          </Description>
          {detailData.summary_data.overview.market_analysis_economy?.map(
            (analysis: MarketAnalysisEconomy, index) => (
              <BrandCard key={index}>
                <BrandName>{analysis.market_indicator}</BrandName>
                <BrandDescription>{analysis.analysis}</BrandDescription>
              </BrandCard>
            )
          )}

          {/* 투자 전략 */}
          <SectionTitle>투자 전략</SectionTitle>
          <Description>
            현재 경제 상황에 맞춰 실용적인 투자 전략을 제공합니다.
          </Description>
          {detailData.summary_data.overview.investment_strategies_economy?.map(
            (strategy: InvestmentStrategyEconomy, index) => (
              <ProductCard key={index}>
                <BrandName>{strategy.strategy_title}</BrandName>
                <StrategyDescription>
                  {strategy.strategy_description}
                </StrategyDescription>
              </ProductCard>
            )
          )}
        </OverviewContainer>
      )}
      {detailData.section === "뷰티/메이크업" &&
        detailData.summary_data.overview && (
          <OverviewContainer>
            <SectionTitle>뷰티 트렌드</SectionTitle>
            <Description>
              유튜브 영상에서 언급된 뷰티 트렌드와 최신 스타일을 소개합니다.
            </Description>

            {detailData.summary_data.overview.beauty_trends?.map(
              (trend, index) => (
                <Card key={index}>
                  <TrendTitle>{trend.trend_name}</TrendTitle>
                  <TrendDescription>{trend.trend_description}</TrendDescription>
                </Card>
              )
            )}
            <SectionTitle>브랜드 스포트라이트</SectionTitle>
            <Description>
              유튜브 영상에서 주목받은 브랜드와 그 제품들을 소개합니다.
            </Description>

            {detailData.summary_data.overview.brand_spotlight?.map(
              (brand, index) => (
                <BrandCard key={index}>
                  <BrandName>{brand.brand_name}</BrandName>
                  <BrandDescription>{brand.brand_description}</BrandDescription>
                  <ProductCardTitle>🛍️ 대표 제품</ProductCardTitle>
                  {brand.highlighted_products.map((product, idx) => (
                    <ProductCard key={idx}>
                      <ProductName>{product.product_name}</ProductName>
                      <ProductDescription>
                        {product.product_description}
                      </ProductDescription>
                    </ProductCard>
                  ))}
                </BrandCard>
              )
            )}
            <SectionTitle>스타일링 팁</SectionTitle>
            <Description>
              영상에 등장한 뷰티 제품을 활용한 실용적인 스타일링 팁을
              제공합니다.
            </Description>

            {detailData.summary_data.overview.styling_tips?.map(
              (tip, index) => (
                <TipCard key={index}>
                  <TipTitle>{tip.tip_title}</TipTitle>
                  <TipDescription>{tip.tip_description}</TipDescription>
                  {tip.recommended_product.map((product, idx) => (
                    <ProductUsageTip key={idx}>
                      <strong>💡 추천 제품 : {product.product_name}</strong>
                      <br />
                      {product.product_usage_tip}
                    </ProductUsageTip>
                  ))}
                </TipCard>
              )
            )}
          </OverviewContainer>
        )}

      {detailData.section === "인공지능" &&
        detailData.summary_data.overview && (
          <OverviewContainer>
            <SectionTitle>AI 트렌드</SectionTitle>
            <Description>
              유튜브 영상에서 설명된 AI 기술의 발전 동향을 소개합니다.
            </Description>
            {detailData.summary_data.overview.ai_trends?.map((trend, index) => (
              <Card key={index}>
                <TrendTitle>{trend.trend_name}</TrendTitle>
                <TrendDescription>{trend.trend_description}</TrendDescription>
              </Card>
            ))}
            <SectionTitle>AI 적용 기술</SectionTitle>
            <Description>영상에 소개된 AI 기술들을 설명합니다.</Description>
            {detailData.summary_data.overview.related_technologies?.map(
              (tech: RelatedTechnology, index) => (
                <BrandCard key={index}>
                  <BrandName>{tech.technology_name}</BrandName>
                  <BrandDescription>
                    {tech.technology_description}
                  </BrandDescription>
                  <ProductCardDescription>주요 특징</ProductCardDescription>
                  {tech.usage_tips.map((technology, idx) => (
                    <ProductCard key={idx}>
                      <ProductName>{technology.tip_title}</ProductName>
                      <ProductDescription>
                        {technology.tip_description}
                      </ProductDescription>
                    </ProductCard>
                  ))}
                </BrandCard>
              )
            )}
          </OverviewContainer>
        )}
      {detailData.section === "비즈니스/사업" &&
        detailData.summary_data.overview && (
          <OverviewContainer>
            <SectionTitle>비즈니스 트렌드</SectionTitle>
            <Description>
              유튜브 영상에서 설명된 비즈니스 업계에서 주목받고 있는 최신
              트렌드와 변화의 흐름을 소개합니다.
            </Description>
            {detailData.summary_data.overview.business_trends?.map(
              (trend, index) => (
                <Card key={index}>
                  <TrendTitle>{trend.trend_name}</TrendTitle>
                  <TrendDescription>{trend.trend_description}</TrendDescription>
                </Card>
              )
            )}
            <SectionTitle>전략적 인사이트</SectionTitle>
            <Description>
              영상에서 공유된 공적인 비즈니스를 위한 핵심 전략과 아이디어를
              소개합니다.
            </Description>
            {detailData.summary_data.overview.strategic_insights?.map(
              (insight: StrategicInsight, index) => (
                <BrandCard key={index}>
                  <BrandName>{insight.strategy_name}</BrandName>
                  <BrandDescription>
                    {insight.strategy_description}
                  </BrandDescription>
                  <BusniessTipTitle>💡실전 팁</BusniessTipTitle>
                  {insight.application_tips.map((tip: ApplicationTip, idx) => (
                    <TipContainer key={idx}>
                      <TipTitle>{tip.tip_title}</TipTitle>
                      <TipDescription>{tip.tip_description}</TipDescription>
                      {tip.related_tools.map((tool: RelatedTool, toolIdx) => (
                        <ProductCard key={toolIdx}>
                          <TipTitle>{tool.tool_name}</TipTitle>
                          <ToolUsageDescription>
                            {tool.tool_usage_description}
                          </ToolUsageDescription>
                        </ProductCard>
                      ))}
                    </TipContainer>
                  ))}
                </BrandCard>
              )
            )}
          </OverviewContainer>
        )}

      {/* 패션 섹션 */}
      {(detailData.section === "남자 패션" ||
        detailData.section === "여자 패션") &&
        detailData.summary_data.overview && (
          <OverviewContainer>
            <SectionTitle>패션 트렌드</SectionTitle>
            <Description>
              유튜브 영상에서 언급된 패션 트렌드와 최신 스타일을 소개합니다.
            </Description>
            {detailData.summary_data.overview.fashion_trends?.map(
              (trend, index) => (
                <Card key={index}>
                  <TrendTitle>{trend.trend_name}</TrendTitle>
                  <TrendDescription>{trend.trend_description}</TrendDescription>
                </Card>
              )
            )}

            <SectionTitle>브랜드 스포트라이트</SectionTitle>
            <Description>
              유튜브 영상에서 주목받은 브랜드와 그 제품들을 소개합니다.
            </Description>
            {detailData.summary_data.overview.brand_spotlight_fashion?.map(
              (brand, index) => (
                <BrandCard key={index}>
                  <BrandName>{brand.brand_name}</BrandName>
                  <BrandDescription>{brand.brand_description}</BrandDescription>
                  <ProductCardTitle>🛍️ 대표 제품</ProductCardTitle>
                  {brand.highlighted_items.map((item, idx) => (
                    <ProductCard key={idx}>
                      <ProductName>{item.item_name}</ProductName>
                      <ProductDescription>
                        {item.item_description}
                      </ProductDescription>
                    </ProductCard>
                  ))}
                </BrandCard>
              )
            )}

            <SectionTitle>스타일링 팁</SectionTitle>
            <Description>
              영상에 등장한 패션 제품을 활용한 실용적인 스타일링 팁을
              제공합니다.
            </Description>
            {detailData.summary_data.overview.styling_tips_fashion?.map(
              (tip, index) => (
                <TipCard key={index}>
                  <TipTitle>{tip.tip_title}</TipTitle>
                  <TipDescription>{tip.tip_description}</TipDescription>
                  {tip.recommended_item.map((item, idx) => (
                    <ProductUsageTip key={idx}>
                      <strong>💡 추천 제품 : {item.item_name}</strong> <br />
                      {item.usage_tip}
                    </ProductUsageTip>
                  ))}
                </TipCard>
              )
            )}
          </OverviewContainer>
        )}
      {/* <Preview $isFixed={isFixed}>
        <div>
          <span>🔎 미리보기</span>
          {formatSummary(detailData.summary_data.short_summary)}
        </div>
      </Preview> */}
      <TOC>
        <div>목차</div>
        <div>
          {detailData.summary_data.section.map(({ title }, index) => (
            <span key={index}>{title} </span>
          ))}
        </div>
      </TOC>
      <Contents
        detailData={detailData}
        thumbnails={thumbnails}
        handleTocItemClick={handleTocItemClick}
      />
    </Container>
  );
};

export default ClientSide;

const Container = styled.div<{ $isFixed: boolean }>`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: white;
`;

const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  margin-bottom: 16px;
`;

const Category = styled.span`
  font-size: 16px;
  font-weight: 600;
  line-height: 19.09px;
  color: #007bff;
  margin-bottom: 12px;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 800;
  line-height: 24px;
  margin-bottom: 4px;
`;

const UploadContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const Upload = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 14.4px;
  margin-right: 4px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
`;

const Preview = styled.div<{ $isFixed: boolean }>`
  padding: 20px;
  margin-top: ${(props) => (props.$isFixed ? "40px" : "28px")};

  div {
    display: flex;
    flex-direction: column;
    background-color: #f2f2f2;
    padding: 20px;
    gap: 12px;
  }

  span {
    display: block;
    font-family: "Pretendard Variable";
    font-size: 16px;
  }

  span:first-child {
    font-weight: 600;
  }

  span.line-break {
    font-weight: 400;
    line-height: 160%;
    margin-bottom: 8px;
  }
`;

const TOC = styled.div`
  margin-top: 100px;
  padding: 0 16px;

  div:first-child {
    height: 44px;
    padding: 10px 16px 10px 16px;
    background-color: rgba(0, 0, 0, 1);
    font-size: 20px;
    font-weight: 800;
    line-height: 24px;
    color: rgba(255, 255, 255, 1);
  }

  div:nth-child(2) {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background-color: rgb(248, 248, 248);
    font-size: 18px;
    font-weight: 600;
    line-height: 19.09px;
  }
`;

const VideoContainer = styled.div<{ $isFixed: boolean; $isDesktop: boolean }>`
  position: ${(props) => (props.$isFixed ? "fixed" : "static")};
  top: ${(props) => (props.$isFixed ? "52px" : "auto")};
  left: ${(props) => (props.$isFixed ? "0" : "auto")};
  z-index: ${(props) => (props.$isFixed ? 1000 : 0)};
  display: flex;

  div {
    width: 100vw;

    iframe {
      width: 100vw;
      max-width: ${({ $isDesktop }) => ($isDesktop ? "420px" : "none")};
    }
  }
`;

const LoaderAnimation = keyframes`
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: 200px 0;
    }
`;

const Loader = styled.div`
  width: 360px;
  height: 202px;
  background: #f0f0f0;
  background-image: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${LoaderAnimation} 1.5s infinite;
`;

const OverviewTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-top: 40px;
  margin-left: 16px;
`;

const OverviewContainer = styled.div`
  padding: 0 16px;
  margin-top: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  margin-top: 12px;
  &:nth-of-type(2) {
    margin-top: 32px;
  }
  &:nth-of-type(3) {
    margin-top: 32px; // Different margin for the third SectionTitle
  }
  &:nth-of-type(4) {
    margin-top: 32px; // Different margin for the third SectionTitle
  }
`;

const Analysis = styled.p`
  font-size: 16px;
  line-height: 132%;
  background-color: #f0f4ff;
  padding: 16px 12px;
  border-radius: 4px;
  margin-top: 12px;
`;

const StockCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px 12px;
  margin-top: 8px;
  margin-bottom: 20px;
`;

const StockName = styled.h4`
  font-size: 16px;
  font-weight: 700;
`;

const StockDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 16px;
  margin-top: 4px;
`;

const StockAnalysisText = styled.p`
  font-size: 16px;
  color: #000;
  line-height: 132%;
`;
const Card = styled.div`
  background-color: #f7f9fc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const TrendTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  line-height: 132%;
`;
const AITrendTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  line-height: 132%;
`;

const TrendDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  line-height: 128%;
`;

const BrandCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
`;

const BrandName = styled.h3`
  font-size: 18px;
  font-weight: 700;
`;

const BrandDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  margin-bottom: 12px;
  line-height: 120%;
`;

const ProductCard = styled.div`
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
`;

const ProductCardTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
`;

const ProductName = styled.h4`
  font-size: 14px;
  font-weight: 600;
`;

const ProductDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 8px;
  line-height: 128%;
`;

const TipCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const TipTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
`;

const BusniessTipTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-top: 24px;
`;

const TipDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  margin-bottom: 12px;
  line-height: 120%;
`;

const ProductUsageTip = styled.p`
  font-size: 13px;
  color: #888;
  margin-top: 16px;
  line-height: 132%;
  strong {
    font-weight: 700;
    margin-bottom: 4px;
  }
`;

const ProductCardDescription = styled.div`
  font-size: 16px;
  margin-top: 20px;
  font-weight: 600;
`;

const StrategyDescription = styled.p`
  font-size: 14px;
  margin-bottom: 8px;
  margin-top: 8px;
  line-height: 128%;
`;

const TipContainer = styled.div`
  background-color: #f7f7f7;
  padding: 10px;
  margin-top: 8px;
  border-radius: 6px;
`;

const ToolCard = styled.div`
  background-color: #e8f5e9;
  padding: 8px;
  border-radius: 6px;
  margin-top: 8px;
`;

const ToolName = styled.h5`
  font-size: 15px;
  font-weight: bold;
  color: #2e7d32;
`;

const ToolUsageDescription = styled.p`
  font-size: 14px;
  color: #333;
  line-height: 1.4;
`;
