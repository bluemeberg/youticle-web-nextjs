"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useRecoilValue } from "recoil";

import LogoHeader from "@/common/LogoHeader";
import { userState } from "@/store/user";
import type { InsightSource } from "@/types/insight";
import {
  getOrCreateAnonId,
  removeMarkTags,
  timeAgo,
  parseSubscribersCount,
} from "@/utils/formatter";
import { logCtaClick } from "@/api/apiClient";

interface StoredEvidencePayload {
  section: string | null;
  stock: {
    stock_name: string;
    ticker?: string;
    metrics?: {
      currency?: string;
      price?: { prev_close?: number | null } | null;
      change_pct?: number | null;
      change_amount?: number | null;
      volume?: number | null;
      market_cap?: number | null;
    } | null;
    sources?: InsightSource[];
  };
}

const SECTION_KEYWORD_MAP: Record<string, string> = {
  "국내 주식": "domestic_stock",
  "해외 주식": "overseas_stock",
};

const EvidencePageClient = () => {
  const router = useRouter();
  const user = useRecoilValue(userState);
  const [payload, setPayload] = useState<StoredEvidencePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem("evidence:payload");
      setPayload(raw ? (JSON.parse(raw) as StoredEvidencePayload) : null);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  const stock = payload?.stock;
  const sources = stock?.sources?.filter(Boolean) ?? [];
  const sectionLabel = payload?.section ?? "";
  const backTargetHref = (() => {
    const section = payload?.section?.trim() ?? "";
    const keyword = SECTION_KEYWORD_MAP[section];
    return keyword ? `/?keyword=${keyword}` : "/";
  })();

  const handleNavigateBack = () => router.push(backTargetHref);

  if (!stock || sources.length === 0) {
    return (
      <>
        <LogoHeader
          title="근거 영상 모아보기"
          onBack={handleNavigateBack}
          onBackHome={handleNavigateBack}
        />
        <PageWrapper>
          <EmptyState>
            <p>근거 영상 정보를 찾을 수 없습니다.</p>
            <ActionRow>
              <ActionButton type="button" onClick={handleNavigateBack}>
                이전 페이지로 돌아가기
              </ActionButton>
              <ActionLink href="/today">오늘 인사이트 바로가기</ActionLink>
            </ActionRow>
          </EmptyState>
        </PageWrapper>
      </>
    );
  }

  const pageTitle = `${stock.stock_name} 근거 영상 모아보기`;
  const metricSnapshot = stock.metrics ?? null;

  return (
    <>
      <LogoHeader
        title={pageTitle}
        onBack={handleNavigateBack}
        onBackHome={handleNavigateBack}
      />
      <PageWrapper>
        {/* ① 종목 헤더 */}
        <StockHero>
          <HeroMain>
            <StockChip>{stock.ticker || stock.stock_name}</StockChip>
            <StockName>{stock.stock_name}</StockName>
            {metricSnapshot?.change_pct != null ? (
              <ChangePill $positive={metricSnapshot.change_pct >= 0}>
                {metricSnapshot.change_pct >= 0 ? "+" : ""}
                {metricSnapshot.change_pct.toFixed(2)}%
              </ChangePill>
            ) : null}
          </HeroMain>
          <HeroActions>
            <HeroButtonPrimary>알림받기</HeroButtonPrimary>
            <HeroButtonGhost>워치리스트 추가</HeroButtonGhost>
          </HeroActions>
        </StockHero>

        {/* ② 메트릭 스냅샷 (종목 헤더 바로 아래) */}
        {metricSnapshot ? (
          <MetricSummary>
            <MetricPrimary>
              <MetricLabel>현재가</MetricLabel>
              <MetricValue>
                {formatCurrency(
                  metricSnapshot.price?.prev_close ?? null,
                  metricSnapshot.currency
                )}
              </MetricValue>
              {renderChange(metricSnapshot)}
            </MetricPrimary>
            <MetricGrid>
              <MetricItem>
                <span>거래량</span>
                <strong>{formatCompactNumber(metricSnapshot.volume)}</strong>
              </MetricItem>
              <MetricItem>
                <span>시가총액</span>
                <strong>
                  {formatCompactCurrency(
                    metricSnapshot.market_cap,
                    metricSnapshot.currency
                  )}
                </strong>
              </MetricItem>
            </MetricGrid>
          </MetricSummary>
        ) : null}

        {/* ③ 섹션 타이틀: 근거 영상 모아보기 */}
        <SectionHeader>
          <SectionTitle>근거 영상 모아보기</SectionTitle>
          <SectionSub>{sectionLabel || "인사이트"}</SectionSub>
        </SectionHeader>

        {/* ④ 카드 리스트 */}
        <EvidenceList>
          {sources.map((source) => {
            const summaryLines = buildSummaryLines(source);
            const summaryText =
              removeMarkTags(source.summary ?? "") || summaryLines[0] || "";
            const relativeUpload = source.upload_date
              ? timeAgo(source.upload_date)
              : null;

            const focusHref = {
              pathname: `/detail/${source.video_id}`,
              query: { focus: "stock-mentions", stock: stock.ticker },
            } as const;
            const fullHref = {
              pathname: `/detail/${source.video_id}`,
            } as const;

            const handleFocusClick = () =>
              logCtaClick(
                "evidence_focus_click",
                user?.id,
                source.video_id,
                getOrCreateAnonId()
              ).catch(() => {});

            const handleFullClick = () =>
              logCtaClick(
                "evidence_full_click",
                user?.id,
                source.video_id,
                getOrCreateAnonId()
              ).catch(() => {});

            return (
              <EvidenceCard
                key={`${source.video_id}-${stock.ticker ?? stock.stock_name}`}
              >
                <VideoMainRow>
                  <VideoThumbnail>
                    {source.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={source.thumbnail}
                        alt={source.title ?? stock.stock_name}
                      />
                    ) : (
                      <VideoThumbnailFallback>
                        <span>{stock.stock_name}</span>
                      </VideoThumbnailFallback>
                    )}
                  </VideoThumbnail>
                  <VideoBody>
                    <VideoTitle>
                      {removeMarkTags(
                        source.summary_data?.headline_title ??
                          source.title ??
                          stock.stock_name
                      )}
                    </VideoTitle>
                    {summaryText ? (
                      <VideoSummaryList>
                        <SummaryLine>{summaryText}</SummaryLine>
                      </VideoSummaryList>
                    ) : null}
                  </VideoBody>
                </VideoMainRow>

                <VideoMeta>
                  <ChannelInfo>
                    {source.channel_thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <ChannelAvatar
                        src={source.channel_thumbnail}
                        alt={source.channel_name ?? "채널"}
                      />
                    ) : null}
                    <div>
                      {source.channel_name ? (
                        <strong>{source.channel_name}</strong>
                      ) : null}
                      <span>
                        {parseSubscribersCount(source.channel_subscribers ?? 0)}
                        {relativeUpload ? (
                          <>
                            {" "}
                            · <small>{relativeUpload}</small>
                          </>
                        ) : null}
                      </span>
                    </div>
                  </ChannelInfo>
                </VideoMeta>

                <EvidenceActions>
                  <PrimaryLink
                    href={focusHref}
                    onClick={handleFocusClick}
                    prefetch={false}
                  >
                    종목 구간만 보기
                  </PrimaryLink>
                  <SecondaryLink
                    href={fullHref}
                    onClick={handleFullClick}
                    prefetch={false}
                  >
                    영상 요약 전체 보기
                  </SecondaryLink>
                </EvidenceActions>
              </EvidenceCard>
            );
          })}
        </EvidenceList>
      </PageWrapper>
    </>
  );
};

export default EvidencePageClient;

/* ---------- helpers ---------- */

function buildSummaryLines(source: InsightSource): string[] {
  const raw = removeMarkTags(
    source.summary_data?.short_summary ??
      source.summary_data?.long_summary ??
      source.summary ??
      ""
  );
  if (!raw) return ["요약 정보가 아직 준비되지 않았습니다."];
  const segments = raw
    .split(/\n|(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return [raw];
  return segments.slice(0, 3);
}

function formatCurrency(value?: number | null, currency?: string | null) {
  if (value == null) return "—";
  const unit = currency || "KRW";
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: unit,
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${unit}`;
  }
}

function formatCompactCurrency(
  value?: number | null,
  currency?: string | null
) {
  if (value == null) return "—";
  const unit = currency || "KRW";
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: unit,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${formatCompactNumber(value)} ${unit}`;
  }
}

function formatCompactNumber(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function renderChange(metric: {
  change_pct?: number | null;
  change_amount?: number | null;
  currency?: string | null;
}) {
  const pct = metric.change_pct;
  const amt = metric.change_amount;
  if (pct == null && amt == null) return null;
  const positive = (pct ?? amt ?? 0) >= 0;
  const pctText =
    pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : null;
  const amtText =
    amt != null ? formatCurrency(amt, metric.currency ?? "KRW") : null;
  return (
    <ChangeBadge $positive={positive}>
      {pctText}
      {pctText && amtText ? " · " : ""}
      {amtText}
    </ChangeBadge>
  );
}

/* ---------- styles ---------- */

const PageWrapper = styled.section`
  --gutter-l: max(16px, env(safe-area-inset-left));
  --gutter-r: max(16px, env(safe-area-inset-right));
  --gutter-t: max(24px, env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  padding: calc(var(--gutter-t) + 60px) var(--gutter-r) 48px var(--gutter-l);
  box-sizing: border-box;
  & > *:first-child {
    margin-top: 0;
  }
  @media (min-width: 768px) {
    max-width: 960px;
    padding-left: max(32px, var(--gutter-l));
    padding-right: max(32px, var(--gutter-r));
  }
`;

/* 상단 종목 헤더 */
const StockHero = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
`;

const HeroMain = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const StockChip = styled.span`
  padding: 4px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
`;

const StockName = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
`;

const ChangePill = styled.span<{ $positive?: boolean }>`
  margin-left: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: ${({ $positive }) => ($positive ? "#0b8a42" : "#dc2626")};
  background: ${({ $positive }) => ($positive ? "#ecfdf5" : "#fef2f2")};
`;

const HeroActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  @media (min-width: 420px) {
    flex-direction: row;
    align-items: center;
  }
`;

const HeroButtonPrimary = styled.button`
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #60a5fa;
  background: #60a5fa;
  color: #fff;
  font-weight: 800;
`;

const HeroButtonGhost = styled.button`
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 800;
`;

/* 섹션 타이틀 */
const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 17px;
  font-weight: 900;
  color: #0f172a;
`;

const SectionSub = styled.span`
  font-size: 12px;
  color: #64748b;
`;

/* 메트릭 */
const MetricSummary = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MetricPrimary = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
`;

const MetricLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
`;

const MetricValue = styled.span`
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
`;

const ChangeBadge = styled.span<{ $positive?: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${({ $positive }) => ($positive ? "#0b8a42" : "#dc2626")};
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

const MetricItem = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
  }
  strong {
    font-size: 16px;
    color: #0f172a;
  }
`;

/* 리스트/카드 */
const EvidenceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EvidenceCard = styled.article`
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  overflow: hidden;
`;

const VideoMainRow = styled.div`
  display: flex;
  gap: 16px;
`;

const VideoThumbnail = styled.div`
  width: 160px;
  min-width: 160px;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  background: #e2e8f0;
  box-sizing: border-box;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoThumbnailFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #475569;
  background: #edf2ff;
`;

const VideoBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VideoTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
`;

const VideoSummaryList = styled.ul`
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #1f2937;
  list-style: disc;

  li {
    line-height: 1.5;
  }
`;

const SummaryLine = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
  line-height: 1.2;
  font-size: 14px;
`;

const VideoMeta = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  strong {
    display: block;
    font-size: 14px;
    color: #0f172a;
  }
  span {
    font-size: 12px;
    color: #64748b;
  }
`;

const ChannelAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
  background: #e2e8f0;
`;

const EvidenceActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const PrimaryLink = styled(Link)`
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  color: #fff;
  background: #2563eb;
  border: 1px solid #2563eb;
`;

const SecondaryLink = styled(Link)`
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
`;

/* 빈 상태 */
const EmptyState = styled.div`
  padding: 48px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
  margin: 40px auto;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
`;

const ActionButton = styled.button`
  border-radius: 999px;
  border: 1px solid #cbd5f5;
  background: #f8fafc;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
`;

const ActionLink = styled(Link)`
  border-radius: 999px;
  border: 1px solid #2563eb;
  padding: 10px 16px;
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
`;
