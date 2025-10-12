"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

import styled, { keyframes, css } from "styled-components";
import TopicCard from "./TopicCard";
import MarketInsightSection from "./marketInsight/MarketInsightSection";
import DomesticStockInsightSection from "./insight/DomesticStockInsightSection";
import CryptoInsightSection from "./insight/CryptoInsightSection";
import { DataProps } from "@/types/dataProps";
import TodayIcon from "@/assets/today.svg";
// import { YOUTUBE_TOPICS } from "@/constants/topic";
import GoToTopBtn from "@/common/GoToTopBtn";
import CountdownTimer from "@/common/CountdownTimer";
import SortOptions from "@/common/SortOptions";
import TopicNav from "./TopicNav";
import { topicState } from "@/store/topic";
import { useRecoilValue, useSetRecoilState, useResetRecoilState } from "recoil";
import { unsubscribedDataState } from "@/store/unsubscribeData";
import { userState } from "@/store/user";
import type { MarketInsightCardData } from "@/utils/marketInsight";
import type { InsightSection, InsightSource } from "@/types/insight";
import { removeMarkTags } from "@/utils/formatter";

const TODAY_TITLE = "미구독 중인 키워드 아티클";
const SUBS_TODAY_TITLE = "구독 중인 키워드 아티클";
interface YoutubeTodayProps {
  data: DataProps[];
  subjects: string[]; // 추가된 subjects prop
  marketInsightCards?: MarketInsightCardData[];
  integratedSections?: InsightSection[];
}

const YOUTUBE_TOPICS = [
  { topic: "전체", icon: "🌐" },
  { topic: "주식", icon: "📈" },
  { topic: "국내 주식", icon: "📈" },
  { topic: "해외 주식", icon: "📈" },
  { topic: "부동산", icon: "🏢" },
  { topic: "국내 가상자산", icon: "💰" },
  { topic: "해외 가상자산", icon: "💰" },
  { topic: "경제", icon: "💵" },
  { topic: "정치", icon: "🏛️" },
  { topic: "비즈니스/사업", icon: "💼" },
  { topic: "건강", icon: "🩺" },
  { topic: "피트니스", icon: "🏋️" },
  { topic: "연애/결혼", icon: "❤️" },
  { topic: "육아", icon: "👶" },
  { topic: "뷰티/메이크업", icon: "💄" },
  { topic: "여자 패션", icon: "👗" },
  { topic: "남자 패션", icon: "👔" },
  { topic: "요리", icon: "🍳" },
  { topic: "IT/테크", icon: "💻" },
  { topic: "인공지능", icon: "🤖" },
  { topic: "자동차", icon: "🚗" },
  { topic: "여행", icon: "✈️" },
  { topic: "과학", icon: "🔬" },
  { topic: "역사", icon: "📜" },
];

const GROUPED_TOPICS: Record<string, string[]> = {
  주식: ["주식", "국내 주식", "해외 주식"],
  가상자산: ["국내 가상자산", "해외 가상자산"],
  // 필요하다면 다른 그룹도 추가
};

const METRIC_KEYS = [
  // "category_relative_views_pct",
  "relative_sub_norm_pct",
  "avg_views_per_hour",
  "like_rate_pct",
  "comment_rate_pct",
] as const;
type MetricKey = (typeof METRIC_KEYS)[number];

const METRIC_LABELS: Record<MetricKey, string> = {
  // category_relative_views_pct: "카테고리 조회수 순위",
  relative_sub_norm_pct: "구독자 대비 조회수 순위",
  avg_views_per_hour: "시간당 조회수 순위",
  like_rate_pct: "좋아요율 순위",
  comment_rate_pct: "댓글율 순위",
};

const metricMeta: Record<MetricKey, { icon: string; name: string }> = {
  avg_views_per_hour: { icon: "👁️", name: "시간당 조회수" },
  // category_relative_views_pct: { icon: "📊", name: "조회수" },
  relative_sub_norm_pct: { icon: "👥", name: "구독자당 조회속도" },
  like_rate_pct: { icon: "👍", name: "좋아요율" },
  comment_rate_pct: { icon: "💬", name: "댓글율" },
};

const MARKET_INSIGHT_TARGET_TOPICS = [
  "국내 주식",
  "해외 주식",
  "국내 가상자산",
  "해외 가상자산",
] as const;

const MARKET_INSIGHT_TOPIC_GROUPS: Record<string, string[]> = {
  주식: ["국내 주식", "해외 주식"],
  가상자산: ["국내 가상자산", "해외 가상자산"],
};

const INTEGRATED_SECTION_MAP: Record<string, string> = {
  "국내 주식": "domestic_stock",
  "해외 주식": "overseas_stock",
  "국내 가상자산": "domestic_crypto",
  "해외 가상자산": "overseas_crypto",
};

const inferCardTopics = (card: MarketInsightCardData): string[] => {
  if (card.topics.length > 0) {
    return card.topics;
  }

  const normalized = (card.marketKey ?? card.market ?? "").toUpperCase();
  const inferred: string[] = [];

  if (/(KOSPI|KOSDAQ|KRX)/.test(normalized)) {
    inferred.push("국내 주식");
  }
  if (/(NASDAQ|S&P|DOW|NYSE|AMEX)/.test(normalized)) {
    inferred.push("해외 주식");
  }
  if (/(KRW)/.test(normalized)) {
    inferred.push("국내 가상자산");
  }
  if (/(USD|USDT)/.test(normalized)) {
    inferred.push("해외 가상자산");
  }

  return inferred;
};

const YoutubeToday = ({
  data,
  subjects,
  marketInsightCards = [],
  integratedSections = [],
}: YoutubeTodayProps) => {
  const selectedTopic = useRecoilValue(topicState);
  const setSelectedTopic = useSetRecoilState(topicState);
  const [sortCriteria, setSortCriteria] = useState("engagement");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortOptionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setUnsubscribedData = useSetRecoilState(unsubscribedDataState);
  const resetUnsubscribedData = useResetRecoilState(unsubscribedDataState);
  const user = useRecoilValue(userState);
  const [isRendered, setIsRendered] = useState(false); // 애니메이션을 위한 상태

  const requestedMarketInsightTopics = useMemo<string[]>(() => {
    if (selectedTopic === "전체") {
      return [...MARKET_INSIGHT_TARGET_TOPICS];
    }

    if (MARKET_INSIGHT_TOPIC_GROUPS[selectedTopic]) {
      return [...MARKET_INSIGHT_TOPIC_GROUPS[selectedTopic]];
    }

    if (MARKET_INSIGHT_TARGET_TOPICS.includes(selectedTopic as (typeof MARKET_INSIGHT_TARGET_TOPICS)[number])) {
      return [selectedTopic];
    }

    return [];
  }, [selectedTopic]);

  const visibleMarketInsightCards = useMemo(() => {
    if (marketInsightCards.length === 0) return [];
    const desired = new Set<string>(requestedMarketInsightTopics);
    if (desired.size === 0) return [];

    return marketInsightCards.filter((card) => {
      const topics = inferCardTopics(card);
      return topics.some((topic) => desired.has(topic));
    });
  }, [marketInsightCards, requestedMarketInsightTopics]);

  // 미구독 데이터 필터링
  const unsubscribedData = data.filter(
    (item) => !subjects.includes(item.section)
  );
  // sec → nav에서 클릭할 topic 이름으로 변환
  const toNavTopic = (sec: string) => {
    const g = Object.entries(GROUPED_TOPICS).find(([, arr]) =>
      arr.includes(sec)
    );
    return g ? g[0] : sec;
  };

  // 상위 주제 → 하위 토픽 확장 맵
  const SUB_EXPAND_MAP: Record<string, string[]> = {
    주식: ["국내 주식", "해외 주식"],
    가상자산: ["국내 가상자산", "해외 가상자산"],
  };

  // 구독 목록을 확장(원본 + 하위 토픽)
  const expandSubjects = (subs: string[]) => {
    const out = new Set<string>(subs);
    subs.forEach((s) => SUB_EXPAND_MAP[s]?.forEach((t) => out.add(t)));
    return Array.from(out);
  };
  // 구독(상위) → 하위 토픽까지 확장
  const expandedSubjects = useMemo(() => expandSubjects(subjects), [subjects]);
  const expandedSubsSet = useMemo(
    () => new Set(expandedSubjects),
    [expandedSubjects]
  );
  // useEffect(() => {
  //   if (subjects.length > 0) {
  //     setSelectedTopic(subjects[0]);
  //   }
  //   resetUnsubscribedData();
  // }, [subjects, setSelectedTopic, resetUnsubscribedData]);

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    // 피드 영역 세로 스크롤 초기화 (맨 위로)

    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (sortOptionsRef.current) {
      const { top } = sortOptionsRef.current.getBoundingClientRect();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleSortClick = (criteria: string) => {
    setSortCriteria(criteria);
  };

  const handleClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(!tooltipVisible);
  };

  const [clientData, setClientData] = useState<DataProps[]>([]);

  const videoMetaMap = useMemo(() => {
    const map = new Map<string, InsightSource>();
    clientData.forEach((item) => {
      if (!item?.video_id) return;
      const summaryText = removeMarkTags(item.summary_data?.short_summary || "").trim();
      map.set(item.video_id, {
        video_id: item.video_id,
        channel_subscribers: item.channel_details?.channel_subscribers,
        channel_id: item.channel_details?.channel_id,
        title: item.title,
        thumbnail: item.thumbnail,
        upload_date: item.upload_date,
        channel_name: item.channel_details?.channel_name,
        channel_thumbnail: item.channel_details?.channel_thumbnail,
        summary: summaryText.length > 0 ? summaryText : undefined,
        summary_data: item.summary_data,
      });
    });
    return map;
  }, [clientData]);

  const enrichedIntegratedSections = useMemo(() => {
    if (!integratedSections || integratedSections.length === 0) {
      return integratedSections;
    }

    return integratedSections.map((section) => {
      const stocks = section.data?.stocks?.map((stock) => {
        if (!stock || !stock.sources || stock.sources.length === 0) return stock;

        const sources = stock.sources.map((source) => {
          if (!source) return source;
          const meta = videoMetaMap.get(source.video_id);
          if (!meta) return source;
          const summary = meta.summary?.trim();

          return {
            ...source,
            channel_subscribers: source.channel_subscribers ?? meta.channel_subscribers,
            channel_id: source.channel_id ?? meta.channel_id,
            title: meta.title ?? source.title,
            thumbnail: meta.thumbnail ?? source.thumbnail,
            upload_date: meta.upload_date ?? source.upload_date,
            channel_name: source.channel_name ?? meta.channel_name,
            channel_thumbnail: source.channel_thumbnail ?? meta.channel_thumbnail,
            summary: summary && summary.length > 0 ? summary : source.summary,
            summary_data: source.summary_data ?? meta.summary_data,
          };
        });

        return {
          ...stock,
          sources,
        };
      });

      return {
        ...section,
        data: {
          ...section.data,
          stocks,
        },
      };
    });
  }, [integratedSections, videoMetaMap]);

  const integratedMap = useMemo(() => {
    const map = new Map<string, InsightSection>();
    enrichedIntegratedSections.forEach((section) => {
      map.set(section.key, section);
      map.set(section.label, section);
    });
    return map;
  }, [enrichedIntegratedSections]);

  const selectedIntegratedSection = useMemo(() => {
    const key = INTEGRATED_SECTION_MAP[selectedTopic];
    if (key) {
      const byKey = integratedMap.get(key);
      if (byKey) return byKey;
    }
    return integratedMap.get(selectedTopic);
  }, [integratedMap, selectedTopic]);

  useEffect(() => {
    // 클라이언트 측에서만 데이터를 세팅 (서버와 클라이언트의 데이터를 일치시키기 위해 초기 데이터 사용)
    setClientData(data);
    setTimeout(() => setIsRendered(true), 100); // 애니메이션 트리거
  }, [data]);

  // Unsubscribe 페이지로 이동하며 미구독 데이터를 전달하는 함수
  const handleUnsubscribeClick = () => {
    setUnsubscribedData(unsubscribedData);
    router.push("/today/unsubscribe");
  };
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false); // 토글 상태
  const filteredAndSortedData = useMemo(() => {
    const seen = new Set<string>();

    return (
      clientData
        .filter((item) => {
          // 1) “구독중만 보기”일 때는 확장된 구독 집합으로 필터
          if (showSubscribedOnly && expandedSubsSet.size > 0) {
            if (selectedTopic === "전체") {
              return expandedSubsSet.has(item.section);
            }

            // 선택한 토픽이 상위 그룹인 경우(예: 주식) → 그 하위까지 허용
            const group = GROUPED_TOPICS[selectedTopic];
            if (group) {
              return (
                (group.includes(item.section) &&
                  group.some((g) => expandedSubsSet.has(g))) ||
                expandedSubsSet.has(selectedTopic)
              ); // 상위 자체 구독도 인정
            }

            // 일반 토픽
            return (
              expandedSubsSet.has(item.section) &&
              item.section === selectedTopic
            );
          }

          // 2) 전체 보기일 때는 기존 로직
          if (selectedTopic === "전체") {
            return true;
          }

          // 3) 상위 그룹(주식/가상자산) 클릭 시 하위 토픽 포함
          const group = GROUPED_TOPICS[selectedTopic];
          if (group) {
            return group.includes(item.section);
          }

          // 4) 일반 토픽
          return item.section === selectedTopic;
        })
        // 중복 video_id 제거
        .filter((item) => {
          if (seen.has(item.video_id)) return false;
          seen.add(item.video_id);
          return true;
        })
        .sort((a, b) => {
          if (sortCriteria === "engagement") return b.score - a.score;
          return b.views + b.likes * 10 - (a.views + a.likes * 10);
        })
    );
  }, [
    clientData,
    showSubscribedOnly,
    expandedSubsSet,
    selectedTopic,
    sortCriteria,
  ]);
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollRefTop = scrollRef.current.getBoundingClientRect().top;
        setIsFixed(scrollRefTop <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 구독중인 주제 서버 불러오기
  // 주제가 있다면

  const handleChangeSubjectClick = () => {
    router.push("/subject/modify");
  };

  const filteredSubjects = showSubscribedOnly
    ? expandedSubjects // 상위 구독시 하위(국내/해외)까지 네비에 노출
    : YOUTUBE_TOPICS.map((t) => t.topic);
  // ① 필터＋정렬된 리스트가 바뀔 때마다, 각 메트릭별 랭킹 맵을 계산

  const metricRanks = useMemo(() => {
    const ranks: Record<MetricKey, Map<string, number>> = {
      // category_relative_views_pct: new Map(),
      relative_sub_norm_pct: new Map(),
      avg_views_per_hour: new Map(),
      like_rate_pct: new Map(),
      comment_rate_pct: new Map(),
    };

    // ① 전체 항목에서 “섹션명” 만 뽑아서 중복 제거
    const sections = Array.from(
      new Set(filteredAndSortedData.map((v) => v.section))
    );

    METRIC_KEYS.forEach((key) => {
      // ② 섹션별로 그룹핑 해서, 해당 그룹 내에서만 순위를 매김
      sections.forEach((sec) => {
        const groupItems = filteredAndSortedData.filter(
          (v) => v.section === sec
        );
        const sortedGroup = [...groupItems].sort(
          (a, b) => (b.summary_data[key] ?? 0) - (a.summary_data[key] ?? 0)
        );
        sortedGroup.forEach((item, idx) => {
          ranks[key].set(item.video_id, idx + 1);
        });
      });
    });

    return ranks;
  }, [filteredAndSortedData]);

  const feedRef = useRef<HTMLDivElement>(null);

  return (
    <Container ref={feedRef}>
      <Header>
        {subjects.length > 0 && ( // 구독한 주제가 있을 때만 렌더링
          <ToggleContainer>
            <ToggleLabel>📌 구독중인 키워드 브리핑만 보기</ToggleLabel>
            <ToggleButtonContainer>
              <ToggleButton
                isActive={showSubscribedOnly}
                onClick={() => {
                  setShowSubscribedOnly(true); // 구독 키워드 보기 활성화
                  setSelectedTopic("전체"); // 섹션 초기화
                }}
              >
                ON
              </ToggleButton>
              <ToggleButton
                isActive={!showSubscribedOnly}
                onClick={() => {
                  setShowSubscribedOnly(false); // 구독 키워드 보기 비활성화
                  setSelectedTopic("전체"); // 섹션 초기화
                }}
              >
                OFF
              </ToggleButton>
            </ToggleButtonContainer>
          </ToggleContainer>
        )}
      </Header>
      <SubContainer>
        <TopicNavContainer ref={scrollRef}>
          <TopicNav
            $isFixed={isFixed}
            selectedTopic={selectedTopic}
            handleTopicClick={handleTopicClick}
            subjects={filteredSubjects} // 구독 주제 전달
            unSubscribe={[]}
            showSubscribedOnly={showSubscribedOnly}
            subscribedSubjects={expandedSubjects} // 구독 주제 전달 (색상 변경용)
            belowNavContent=
              <>
                {selectedIntegratedSection ? (
                  (selectedIntegratedSection.label === "국내 가상자산" ||
                    selectedIntegratedSection.label === "해외 가상자산" ||
                    /_crypto$/.test(selectedIntegratedSection.key)) ? (
                    <CryptoInsightSection section={selectedIntegratedSection} />
                  ) : (
                    <DomesticStockInsightSection
                      section={selectedIntegratedSection}
                    />
                  )
                ) : null}
              </>
          ></TopicNav>
        </TopicNavContainer>
        {/* <CountdownTimer /> */}
      </SubContainer>
      {/* 여기서 Topic별 subtitle 추가 */}

      {/* <SortOptions
        ref={sortOptionsRef}
        isFixed={isFixed}
        sortCriteria={sortCriteria}
        tooltipVisible={tooltipVisible}
        setTooltipVisible={setTooltipVisible}
        handleSortClick={handleSortClick}
        handleClickIcon={handleClickIcon}
        variant="default"
      /> */}
      {/* 🛠 애니메이션 추가 */}
      <TopicCardWrapper $isRendered={isRendered}>
        <EditorContainer>
          {filteredAndSortedData.map((item, index) => {
            const topicInfo = YOUTUBE_TOPICS.find(
              (topic) => topic.topic === item.section
            );
            const isSubscribed =
              expandedSubsSet.has(item.section) ||
              // 상위 토픽(주식/가상자산)을 직접 구독한 경우도 안전망으로 케어
              expandedSubsSet.has(toNavTopic(item.section));
            // ② 이 아이템에 대해 가장 좋은(=작은) 랭킹을 가진 key 찾기
            let bestKey: MetricKey = METRIC_KEYS[0];
            let bestRank = metricRanks[bestKey].get(item.video_id)!;

            METRIC_KEYS.forEach((key) => {
              const rank = metricRanks[key].get(item.video_id)!;
              if (rank < bestRank) {
                bestKey = key;
                bestRank = rank;
              }
            });

            // const metricLabel = METRIC_LABELS[bestKey];
            const metricValue = item.summary_data[bestKey];
            // metricMeta에서 icon, name 가져오기
            const { icon: metricIcon, name: metricLabel } = metricMeta[bestKey];
            const navTopic = toNavTopic(item.section);

            return (
              <TopicCard
                key={item.video_id}
                icon={topicInfo?.icon}
                subjects={subjects}
                metricIcon={metricIcon}
                metricLabel={metricLabel}
                metricValue={metricValue}
                rank={bestRank}
                {...item}
              />
            );
          })}
        </EditorContainer>
      </TopicCardWrapper>

      {/* {subjects.length > 0 && (
        <UnSubsArticleInfo>
          <UnSubsArticleInfoDescription>
            구독중인 아티클을 다 보셨나요? <br /> 미구독중인 키워드의 아티클도
            구경해보세요!
          </UnSubsArticleInfoDescription>
          <UnSubsArticleInfoButton onClick={handleUnsubscribeClick}>
            미구독중인 아티클 확인하러가기
          </UnSubsArticleInfoButton>
        </UnSubsArticleInfo>
      )} */}
      <GoToTopBtn isVisible={isFixed} />
    </Container>
  );
};

export default YoutubeToday;

/* 🛠 스타일 추가 */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const TopicCardWrapper = styled.div<{ $isRendered: boolean }>`
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(10px);
  animation: ${({ $isRendered }) =>
    $isRendered &&
    css`
      ${fadeIn} 0.6s ease-in-out forwards
    `};
`;

const Container = styled.div`
  width: 100%;
  background-color: #ffff;
  display: flex;
  flex-direction: column;
  margin-top: 4px;
  font-family: "Pretendard Variable";
`;

// SubContainer modified to use React.forwardRef
const SubContainer = styled.div.attrs(({ ref }) => ({ ref }))`
  background-color: #fff;
`;

const ChangeSubjectButton = styled.div`
  background-color: #000;
  padding: 12px 16px;
  color: white;
  width: 140px;
  display: flex;
  justify-content: center;
  border-radius: 4px;
  font-weight: 500;
  margin-top: -12px;
  margin-bottom: 32px;
`;
const ToggleButtonContainer = styled.div`
  display: flex;
  gap: 8px; /* 버튼 간 간격 */
`;

const Section = styled.div<{ isSubscribed: boolean }>`
  display: inline-flex; /* 텍스트 크기에 맞게 가로폭을 설정 */
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background-color: #f9fafc;
  padding: 6px 8px; /* 내부 여백 */
  border-radius: 4px; /* 둥근 테두리 */
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  overflow: hidden; /* 내용이 넘칠 경우 숨김 */
  text-overflow: ellipsis; /* 넘치는 텍스트 말줄임표 처리 */
  box-sizing: border-box; /* 패딩 포함한 크기 계산 */
  color: ${({ isSubscribed }) =>
    isSubscribed ? "#007BFF" : "#80858a"}; /* 구독 여부에 따른 색상 */
  height: 32px;
  border: 1px solid
    ${({ isSubscribed }) => (isSubscribed ? "#007BFF" : "#c4c4c4")}; /* 구독 여부에 따른 테두리 */
  margin-left: 8px;
  margin-top: 8px;
  margin-bottom: 4px;
`;

const TodayTitle = styled.span<{
  $isSubs?: boolean;
}>`
  font-size: 24px;
  font-weight: 700;
  line-height: 28.64px;
  color: ${({ $isSubs }) => ($isSubs ? "#007BFF" : "#000")};
  letter-spacing: -1px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 4px;
  margin-top: 12px;
`;

const TopicNavContainer = styled.div.attrs<{ ref?: React.Ref<HTMLDivElement> }>(
  (props) => ({
    ref: props.ref,
  })
)`
  padding: 0;
  background-color: #f8f9fa;
`;

const UnSubsArticleInfo = styled.div`
  background-color: #f0f4ff;
  padding: 20px 20px;
  display: flex;
  flex-direction: column;
  margin: 20px;
  border-radius: 8px;
  border: 1px solid #007bff;
  margin-bottom: 40px;
`;

const UnSubsArticleInfoDescription = styled.div`
  margin-bottom: 24px;
  line-height: 132%;
`;

const UnSubsArticleInfoButton = styled.div`
  background-color: black;
  color: white;
  padding: 12px 40px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  font-weight: 500;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
  border: 1px solid #e9e9e9;
  width: 100%;
  margin-left: 16px;
  margin-right: 16px;
  margin-top: 8px;
  border-radius: 4px;
`;

const ToggleLabel = styled.span`
  font-size: 14px;
  font-weight: 400;
`;

const ToggleButton = styled.button<{ isActive: boolean }>`
  width: 60px;
  height: 30px;
  background-color: ${(props) => (props.isActive ? "#007bff" : "#F0F4FF")};
  color: ${(props) => (props.isActive ? "#fff" : "#737373")};
  font-weight: ${(props) => (props.isActive ? 700 : 400)};
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const EditorContainer = styled.div`
  padding-top: 12px;
  border-radius: 8px;
  background-color: #f9f9f9;
`;
const Subtitle = styled.div`
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  background-color: #f0f4ff;
  border-bottom: 1px solid #e0e0e0;
  margin-top: 8px;
`;
