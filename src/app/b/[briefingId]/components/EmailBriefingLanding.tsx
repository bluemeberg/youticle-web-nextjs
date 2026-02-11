"use client";

import Link from "next/link";
import styled from "styled-components";
import { useRecoilValue } from "recoil";
import LogoHeader from "@/common/LogoHeader";
import { logCtaClick } from "@/api/apiClient";
import { userState } from "@/store/user";
import { getOrCreateAnonId, removeMarkTags } from "@/utils/formatter";
import type { DeliveryMeta } from "@/types/briefingLanding";
import type {
  EmailBriefingKeywordData,
  EmailBriefingVideoMeta,
} from "@/types/emailBriefing";
import {
  ChannelAvatarImage,
  VideoMetaRow,
  VideoMetaRowContainer,
  VideoMetaRowSubContainer,
  VideoSourceBody,
  VideoSourceCard,
  VideoSourceContainer,
  VideoSourceList,
  VideoSummaryText,
  VideoThumbnailImage,
  VideoThumbnailWrapper,
} from "./LandingDomesticStockInsightSection";

const ECONOMY_BRIEFING_INTRO =
  "최근 100일 동안 업로드된 국내·글로벌 경제 영상만으로 성장/물가/정책, 산업별 수요를 정리했습니다.";

interface EmailBriefingLandingProps {
  briefing: EmailBriefingKeywordData;
  deliveryMeta: DeliveryMeta;
  standalone?: boolean;
}

const InlineVideoList = styled.div`
  margin-top: 16px;
`;

const InlineVideoTitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const InlineVideoThumbnailFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  text-align: center;
  padding: 8px;
`;

const splitSentences = (text: string) => {
  const parts = text.split(/(?<=\.)\s+/);
  const nodes: Array<string | JSX.Element> = [];
  parts.forEach((part, idx) => {
    nodes.push(part);
    if (idx < parts.length - 1) {
      nodes.push(<br key={`br-${idx}-${part}`} />);
    }
  });
  return nodes;
};

const EmailBriefingLanding = ({
  briefing,
  deliveryMeta,
  standalone = true,
}: EmailBriefingLandingProps) => {
  const isLandingEmbed = !standalone;
  const user = useRecoilValue(userState);
  const renderMarked = (text?: string | number | null) => {
    const safeText = text == null ? "" : String(text);
    const segments = safeText.split(/(<mark>.*?<\/mark>)/g).filter(Boolean);
    return segments.map((segment, idx) => {
      if (segment.startsWith("<mark>") && segment.endsWith("</mark>")) {
        const content = segment.replace(/<\/?mark>/g, "");
        return (
          <Mark key={`mark-${content}-${idx}`}>{splitSentences(content)}</Mark>
        );
      }
      return <span key={`text-${idx}`}>{splitSentences(segment)}</span>;
    });
  };

  const getVideos = (ids?: string[]) =>
    (ids ?? [])
      .map((id) => briefing.videos[id])
      .filter((video): video is EmailBriefingVideoMeta => Boolean(video));

  const renderVideoCard = (video: EmailBriefingVideoMeta) => (
    <VideoCard
      key={video.id}
      href={video.href}
      target="_blank"
      rel="noreferrer"
    >
      <VideoThumb>
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
      </VideoThumb>
      <VideoBody>
        <VideoTitle>{video.title}</VideoTitle>
        <VideoMeta>
          {video.channelThumbnail ? (
            <VideoAvatar>
              <img
                src={video.channelThumbnail}
                alt={video.channelName}
                loading="lazy"
              />
            </VideoAvatar>
          ) : null}
          <VideoChannelText>
            <strong>{video.channelName}</strong>
            {video.subscriberText ? <span>{video.subscriberText}</span> : null}
          </VideoChannelText>
        </VideoMeta>
      </VideoBody>
    </VideoCard>
  );

  const renderInlineVideoCard = (
    video: EmailBriefingVideoMeta,
    idx: number,
  ) => (
    <VideoSourceCard
      key={`${video.id}-${idx}`}
      href={video.href}
      target="_blank"
      rel="noreferrer"
      prefetch={false}
    >
      <VideoSourceContainer>
        <VideoThumbnailWrapper>
          {video.thumbnail ? (
            <VideoThumbnailImage
              src={video.thumbnail}
              alt={video.title}
              width={120}
              height={68}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <InlineVideoThumbnailFallback>
              <span>근거 영상</span>
            </InlineVideoThumbnailFallback>
          )}
        </VideoThumbnailWrapper>
        <VideoSourceBody>
          <InlineVideoTitle>{video.title}</InlineVideoTitle>
          {(() => {
            const summaryText = video.summary?.length
              ? removeMarkTags(video.summary[0]).trim()
              : "";
            const fallbackText = summaryText || video.subscriberText || "";
            return fallbackText ? (
              <VideoSummaryText>{fallbackText}</VideoSummaryText>
            ) : null;
          })()}
        </VideoSourceBody>
      </VideoSourceContainer>
      {video.channelThumbnail || video.channelName || video.subscriberText ? (
        <VideoMetaRow>
          {video.channelThumbnail ? (
            <ChannelAvatarImage
              src={video.channelThumbnail}
              alt={video.channelName || "채널"}
              width={40}
              height={40}
              style={{ width: 40, height: 40 }}
            />
          ) : null}
          <VideoMetaRowContainer>
            {video.channelName ? <span>{video.channelName}</span> : null}
            {video.subscriberText ? (
              <VideoMetaRowSubContainer>
                {video.subscriberText}
              </VideoMetaRowSubContainer>
            ) : null}
          </VideoMetaRowContainer>
        </VideoMetaRow>
      ) : null}
    </VideoSourceCard>
  );

  const renderVideoGrid = (ids?: string[]) => {
    const list = getVideos(ids);
    if (!list.length) return null;
    const limitedList = list.slice(0, 2);
    console.log(limitedList);
    if (isLandingEmbed) {
      return (
        <InlineVideoList>
          <VideoSourceList>
            {limitedList.map((video, idx) => renderInlineVideoCard(video, idx))}
          </VideoSourceList>
        </InlineVideoList>
      );
    }
    return <VideoGrid>{limitedList.map(renderVideoCard)}</VideoGrid>;
  };

  const renderStrategicMovesSection = () => {
    if (!briefing.strategicMoves?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🧭 전략적 움직임</SectionLabel>
        <SectionHeading>핵심 전략</SectionHeading>
        <DemandGrid>
          {briefing.strategicMoves.map((move, idx) => {
            const moveVideoIds = Array.from(
              new Set(
                move.narratives.flatMap(
                  (narrative) => narrative.videoIds || [],
                ),
              ),
            );
            return (
              <DemandCard key={`${move.name}-${idx}`}>
                <MacroInfoTitle>{move.name}</MacroInfoTitle>
                <SectionSubheading>무슨 일?</SectionSubheading>
                <BusinessSectionParagraph>
                  {renderMarked(move.whatHappened)}
                </BusinessSectionParagraph>
                <SectionSubheading>왜 중요한가?</SectionSubheading>
                <BusinessSectionParagraph>
                  {renderMarked(move.whyImportant)}
                </BusinessSectionParagraph>
                {move.narratives.length ? (
                  <BulletList>
                    {move.narratives.map((narrative, narrativeIdx) => (
                      <li key={`${move.name}-narrative-${narrativeIdx}`}>
                        {renderMarked(narrative.text)}
                      </li>
                    ))}
                  </BulletList>
                ) : null}
                {renderVideoGrid(moveVideoIds)}
              </DemandCard>
            );
          })}
        </DemandGrid>
      </ContentCard>
    );
  };

  const renderMoneyStrategySection = () => {
    const themes = briefing.themes ?? [];
    if (!themes.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🧭 전략적 움직임</SectionLabel>
        <SectionHeading>전략 스포트라이트</SectionHeading>
        <DemandGrid>
          {themes.map((theme, idx) => {
            const narratives = theme.narratives ?? [];
            const videoIds = Array.from(
              new Set(
                narratives.flatMap((narrative) => narrative.videoIds || []),
              ),
            );
            return (
              <DemandCard key={`${theme.name}-${idx}`}>
                <MacroInfoTitle>{theme.name}</MacroInfoTitle>
                {narratives.length ? (
                  <>
                    <SectionSubheading>핵심 내러티브</SectionSubheading>
                    <NarrativeList>
                      {narratives.map((narrative, narrativeIdx) => (
                        <li
                          key={`${theme.name}-narrative-${narrativeIdx}`}
                        >
                          {renderMarked(narrative.text)}
                        </li>
                      ))}
                    </NarrativeList>
                  </>
                ) : null}
                {renderVideoGrid(videoIds)}
              </DemandCard>
            );
          })}
        </DemandGrid>
      </ContentCard>
    );
  };

  const renderExecutionRisksSection = () => {
    const section = briefing.executionRisks;
    if (!section?.items?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>⚠️ 실행 리스크</SectionLabel>
        <SectionHeading>{section.title || "핵심 위험 요인"}</SectionHeading>
        <MacroInfoGrid>
          {section.items.map((item, idx) => {
            const details = Array.isArray(item.detail)
              ? item.detail
              : item.detail
                ? [item.detail]
                : (item.details ?? []);
            return (
              <MacroRiskCard key={`${item.title}-${idx}`}>
                <MacroInfoTitle>{item.title}</MacroInfoTitle>
                {item.owner ? (
                  <MacroImpactBadge>{item.owner}</MacroImpactBadge>
                ) : null}
                <MacroList>
                  {details.map((line, lineIdx) => (
                    <li key={`${item.title}-exec-${lineIdx}`}>
                      {renderMarked(line)}
                    </li>
                  ))}
                </MacroList>
                {renderVideoGrid(item.videoIds)}
              </MacroRiskCard>
            );
          })}
        </MacroInfoGrid>
      </ContentCard>
    );
  };

  const renderCompetitionWatchSection = () => {
    if (!briefing.competitionWatch?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>⚔️ 경쟁 구도</SectionLabel>
        <SectionHeading>핵심 경쟁 이슈</SectionHeading>
        <PolicyGrid>
          {briefing.competitionWatch.map((item, idx) => (
            <PolicyCard key={`${item.name}-${idx}`}>
              <MacroInfoTitle>{item.name}</MacroInfoTitle>
              {item.detail ? (
                <BusinessSectionParagraph>
                  {renderMarked(item.detail)}
                </BusinessSectionParagraph>
              ) : null}
              {item.signals?.length ? (
                <BulletList>
                  {item.signals.map((signal, signalIdx) => (
                    <li key={`${item.name}-signal-${signalIdx}`}>
                      {renderMarked(signal)}
                    </li>
                  ))}
                </BulletList>
              ) : null}
              {renderVideoGrid(item.videoIds)}
            </PolicyCard>
          ))}
        </PolicyGrid>
      </ContentCard>
    );
  };

  const renderEvidenceGallery = (
    ids?: string[],
    options?: { title?: string; landingTitle?: string },
  ) => {
    const list = getVideos(ids);
    if (!list.length) return null;
    if (isLandingEmbed) {
      return (
        <LandingEvidenceSection>
          <LandingEvidenceHeader>
            <LandingEvidenceTitle>
              {options?.landingTitle || "오늘 갱신된 TOP5 근거영상 모아보기"}
            </LandingEvidenceTitle>
          </LandingEvidenceHeader>
          <LandingEvidenceList>
            {list.map((video, idx) => renderInlineVideoCard(video, idx))}
          </LandingEvidenceList>
        </LandingEvidenceSection>
      );
    }
    return (
      <ContentCard>
        <SectionHeading>{options?.title || "근거 영상"}</SectionHeading>
        <VideoGrid>{list.map(renderVideoCard)}</VideoGrid>
      </ContentCard>
    );
  };

  const referencedVideos =
    (briefing.topVideoIds && briefing.topVideoIds.length > 0
      ? briefing.topVideoIds
      : Object.keys(briefing.videos)) ?? [];

  const renderTickerProfiles = () => {
    if (!briefing.tickerProfiles?.length) return null;
    return briefing.tickerProfiles.map((profile, idx) => (
      <TickerCard key={`${profile.ticker || profile.companyName || idx}`}>
        <TickerHeading>
          <TickerLabel>{profile.companyName || profile.ticker}</TickerLabel>
          {profile.ticker ? <TickerBadge>{profile.ticker}</TickerBadge> : null}
        </TickerHeading>
        {profile.thesis?.length ? (
          <TickerSubheading>핵심 논지</TickerSubheading>
        ) : null}
        {profile.thesis?.length ? (
          <BulletList>
            {profile.thesis.map((line, thesisIdx) => (
              <li key={`thesis-${thesisIdx}`}>{renderMarked(line)}</li>
            ))}
          </BulletList>
        ) : null}
        {profile.signals?.length ? (
          <TickerSubheading>주요 시그널</TickerSubheading>
        ) : null}
        {profile.signals?.length ? (
          <BulletList>
            {profile.signals.map((line, signalIdx) => (
              <li key={`signal-${signalIdx}`}>{renderMarked(line)}</li>
            ))}
          </BulletList>
        ) : null}
        {renderVideoGrid(profile.videoIds)}
      </TickerCard>
    ));
  };

  const renderRiskItems = () => {
    if (!briefing.executionRisks.items.length) return null;
    return briefing.executionRisks.items.map((item, idx) => (
      <RiskCard key={`${item.title}-${idx}`}>
        <RiskHeader>
          <MacroInfoTitle>{item.title}</MacroInfoTitle>
          {item.owner ? <RiskBadge>{item.owner}</RiskBadge> : null}
        </RiskHeader>
        <RiskList>
          {(item.details && item.details.length
            ? item.details
            : item.detail
              ? [item.detail]
              : []
          ).map((line, lineIdx) => (
            <li key={`${item.title}-detail-${lineIdx}`}>
              {renderMarked(line)}
            </li>
          ))}
        </RiskList>
        {renderVideoGrid(item.videoIds)}
      </RiskCard>
    ));
  };

  const renderChecklist = () => {
    if (!briefing.checklist?.length) return null;
    return briefing.checklist.map((item, idx) => (
      <ChecklistCard key={`${item.title}-${idx}`}>
        <ChecklistTitle>{item.title}</ChecklistTitle>
        <ChecklistList>
          {item.detail.map((line, lineIdx) => (
            <li key={`${item.title}-${lineIdx}`}>{renderMarked(line)}</li>
          ))}
        </ChecklistList>
      </ChecklistCard>
    ));
  };

  const renderOutroSection = () => {
    if (!briefing.outro) return null;
    const { title, description, ctaHref, ctaLabel, footnote } = briefing.outro;
    const handleCtaClick = () => {
      void logCtaClick(
        "briefing_feedback_click",
        user?.id,
        user?.email,
        getOrCreateAnonId(),
        { topic: briefing.topicLabel },
      ).catch(() => {});
    };
    return (
      <OutroCard>
        <OutroTitle>{title}</OutroTitle>
        <OutroDescription>{renderMarked(description)}</OutroDescription>
        {ctaHref && ctaLabel ? (
          <CtaButton
            href={ctaHref}
            target="_blank"
            rel="noreferrer"
            prefetch={false}
            onClick={handleCtaClick}
          >
            {ctaLabel}
          </CtaButton>
        ) : null}
        {footnote ? (
          <OutroFootnote>{renderMarked(footnote)}</OutroFootnote>
        ) : null}
      </OutroCard>
    );
  };

  const renderTechSnapshot = () => {
    const snapshot = briefing.techSnapshot;
    if (!snapshot) return null;
    const signalEntries = [
      {
        title: "혁신 시그널",
        value: snapshot.innovationSignal,
        variant: "innovation" as const,
      },
      {
        title: "시장/수요 시그널",
        value: snapshot.marketSignal,
        variant: "market" as const,
      },
      {
        title: "정책·규제 시그널",
        value: snapshot.policySignal,
        variant: "policy" as const,
      },
    ].filter((entry) => entry.value && entry.value.trim().length > 0);

    return (
      <ContentCard>
        <SectionHeading>📊 Tech Snapshot</SectionHeading>
        {snapshot.summary ? (
          <SectionParagraph>{renderMarked(snapshot.summary)}</SectionParagraph>
        ) : null}
        {signalEntries.length ? (
          <SnapshotSignalGrid>
            {signalEntries.map((entry) => (
              <SnapshotSignalCard key={entry.title} $variant={entry.variant}>
                <SignalLabel>{entry.title}</SignalLabel>
                <SignalBody>{renderMarked(entry.value ?? "")}</SignalBody>
              </SnapshotSignalCard>
            ))}
          </SnapshotSignalGrid>
        ) : null}
      </ContentCard>
    );
  };

  const renderInnovationTracksSection = () => {
    if (!briefing.innovationTracks?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🚀 Innovation Track</SectionLabel>
        <SectionHeading>핵심 혁신 루트</SectionHeading>
        <PolicyGrid>
          {briefing.innovationTracks.map((track, idx) => {
            const videoIds = Array.from(
              new Set(
                [...(track.videoIds ?? []),
                ...track.narratives.flatMap((narrative) => narrative.videoIds ?? [])],
              ),
            );
            return (
              <PolicyCard key={`${track.name}-${idx}`}>
                <MacroInfoTitle>{track.name}</MacroInfoTitle>
                {track.provider || track.focusArea ? (
                  <TrackMeta>
                    {track.provider ? <span>{track.provider}</span> : null}
                    {track.focusArea ? (
                      <TrackFocus>{renderMarked(track.focusArea)}</TrackFocus>
                    ) : null}
                  </TrackMeta>
                ) : null}
                {track.narratives.length ? (
                  <>
                    <SectionSubheading>핵심 내러티브</SectionSubheading>
                    <NarrativeList>
                      {track.narratives.map((narrative, narrativeIdx) => (
                        <li key={`${track.name}-story-${narrativeIdx}`}>
                          {renderMarked(narrative.text)}
                        </li>
                      ))}
                    </NarrativeList>
                  </>
                ) : null}
                {track.impactMetrics?.length ? (
                  <>
                    <SectionSubheading>주요 지표</SectionSubheading>
                    <BulletList>
                      {track.impactMetrics.map((metric, metricIdx) => (
                        <li key={`${track.name}-metric-${metricIdx}`}>
                          {renderMarked(metric)}
                        </li>
                      ))}
                    </BulletList>
                  </>
                ) : null}
                {renderVideoGrid(videoIds)}
              </PolicyCard>
            );
          })}
        </PolicyGrid>
      </ContentCard>
    );
  };

  const renderEcosystemWatchSection = () => {
    if (!briefing.ecosystemWatch?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🤝 생태계/파트너십</SectionLabel>
        <SectionHeading>핵심 협력 시그널</SectionHeading>
        <EcosystemGrid>
          {briefing.ecosystemWatch.map((item, idx) => (
            <EcosystemCard key={`${item.segment}-${idx}`}>
              <MacroInfoTitle>{item.segment}</MacroInfoTitle>
              <BulletList>
                {item.signals.map((signal, signalIdx) => (
                  <li key={`${item.segment}-signal-${signalIdx}`}>
                    {renderMarked(signal)}
                  </li>
                ))}
              </BulletList>
              {renderVideoGrid(item.videoIds)}
            </EcosystemCard>
          ))}
        </EcosystemGrid>
      </ContentCard>
    );
  };

  const renderActionItemsSection = () => {
    const section = briefing.actionItems;
    if (!section?.items?.length) return null;
    return (
      <ContentCard>
        <SectionHeading>🧭 {section.title || "실행 체크포인트"}</SectionHeading>
        <ActionGrid>
          {section.items.map((item, idx) => (
            <ActionCard key={`${item.title}-${idx}`}>
              <ActionTitleRow>
                <ChecklistTitle>{item.title}</ChecklistTitle>
                {item.owners?.length ? (
                  <ActionOwnerPill>{item.owners.join(", ")}</ActionOwnerPill>
                ) : null}
              </ActionTitleRow>
              <ChecklistList>
                {(Array.isArray(item.detail)
                  ? item.detail
                  : item.detail
                    ? [item.detail]
                    : []
                ).map((line, detailIdx) => (
                  <li key={`${item.title}-action-${detailIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </ChecklistList>
              {renderVideoGrid(item.videoIds)}
            </ActionCard>
          ))}
        </ActionGrid>
      </ContentCard>
    );
  };

  const renderLegacyLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          {/* <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge> */}
        </HeroMeta>
        {briefing.summaryBadge ? (
          <SummaryBadge>{briefing.summaryBadge}</SummaryBadge>
        ) : null}
        <HeroHeadline>{removeMarkTags(briefing.tldr.headline)}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`legacy-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {renderStrategicMovesSection()}

      {renderExecutionRisksSection()}

      {renderEvidenceGallery(referencedVideos)}

      {renderOutroSection()}
    </>
  );

  const renderBusinessLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge>
        </HeroMeta>
        <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
        <HeroHeadline>{removeMarkTags(briefing.tldr.headline)}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`business-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {renderStrategicMovesSection()}
      {renderCompetitionWatchSection()}
      {renderExecutionRisksSection()}
      {renderActionItemsSection()}

      {renderEvidenceGallery(referencedVideos)}

      {renderOutroSection()}
    </>
  );

  const renderMoneyLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          {/* <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge> */}
        </HeroMeta>
        <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
        <HeroHeadline>{briefing.tldr.headline}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`money-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {briefing.marketMood ? (
        <ContentCard>
          <SectionHeading>🌡️ 시장 분위기</SectionHeading>
          <SectionParagraph>
            {renderMarked(briefing.marketMood.summary || "")}
          </SectionParagraph>
          <MoodSignalGrid>
            {briefing.marketMood.priceSignal ? (
              <MoodSignalCard $variant="warning">
                <p>가격 시그널</p>
                <span>{renderMarked(briefing.marketMood.priceSignal)}</span>
              </MoodSignalCard>
            ) : null}
            {briefing.marketMood.flowSignal ? (
              <MoodSignalCard $variant="info">
                <p>수급/유동성 시그널</p>
                <span>{renderMarked(briefing.marketMood.flowSignal)}</span>
              </MoodSignalCard>
            ) : null}
          </MoodSignalGrid>
        </ContentCard>
      ) : null}

      {renderMoneyStrategySection()}

      {briefing.tickerProfiles?.length ? (
        <ContentCard>
          <SectionHeading>🏅 종목 스포트라이트</SectionHeading>
          <TickerGrid>{renderTickerProfiles()}</TickerGrid>
        </ContentCard>
      ) : null}

      {briefing.executionRisks.items.length ? (
        <ContentCard>
          <SectionHeading>⚠️ 리스크</SectionHeading>
          <RiskGrid>{renderRiskItems()}</RiskGrid>
        </ContentCard>
      ) : null}

      {briefing.checklist?.length ? (
        <ContentCard>
          <SectionHeading>🔭 앞으로 2~3일 체크</SectionHeading>
          <ChecklistGrid>{renderChecklist()}</ChecklistGrid>
        </ContentCard>
      ) : null}

      {renderEvidenceGallery(referencedVideos)}

      {renderOutroSection()}
    </>
  );

  const renderMacroLayout = () => {
    const driverList = briefing.macroDrivers ?? [];
    const policyItems = briefing.macroPolicyWatch?.items ?? [];
    const riskItems = briefing.macroRiskSection?.items ?? [];
    const sectorWatch = briefing.macroSectorWatch ?? [];
    const checklistItems = briefing.macroChecklist?.items ?? [];
    const videoSet = new Set<string>();
    const appendIds = (ids?: string[]) => {
      (ids ?? []).forEach((id) => {
        if (id) videoSet.add(id);
      });
    };
    driverList.forEach((driver) =>
      driver.narratives.forEach((narrative) => appendIds(narrative.videoIds)),
    );
    policyItems.forEach((item) => appendIds(item.videoIds));
    riskItems.forEach((item) => appendIds(item.videoIds));
    sectorWatch.forEach((item) => appendIds(item.videoIds));
    appendIds(briefing.topVideoIds);
    const macroVideoIds = Array.from(videoSet);

    return (
      <>
        <HeroCard>
          <HeroMeta>
            <span>{briefing.topicLabel}</span>
            {/* <HeroBadge>
              {briefing.dateBadge || deliveryMeta.displayLabel}
            </HeroBadge> */}
          </HeroMeta>
          <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
          <HeroHeadline>{briefing.tldr.headline}</HeroHeadline>
          <HeroList>
            {briefing.tldr.bullets.map((bullet, idx) => (
              <li key={`macro-tldr-${idx}`}>{renderMarked(bullet)}</li>
            ))}
          </HeroList>
        </HeroCard>

        {/* <ContentCard>
          <SectionHeading>브리핑 안내</SectionHeading>
          <SectionParagraph>{ECONOMY_BRIEFING_INTRO}</SectionParagraph>
        </ContentCard> */}

        {briefing.macroSnapshot ? (
          <ContentCard>
            <SectionLabel>🌍 거시 스냅샷</SectionLabel>
            <SectionHeading>핵심 거시 시그널</SectionHeading>
            {briefing.macroSnapshot.summary ? (
              <SectionParagraph>
                {renderMarked(briefing.macroSnapshot.summary)}
              </SectionParagraph>
            ) : null}
            <MacroSnapshotGrid>
              {briefing.macroSnapshot.growthSignal ? (
                <MacroSnapshotCard $variant="growth">
                  <MacroSnapshotLabel>성장/활동 시그널</MacroSnapshotLabel>
                  <MacroSnapshotBody>
                    {renderMarked(briefing.macroSnapshot.growthSignal)}
                  </MacroSnapshotBody>
                </MacroSnapshotCard>
              ) : null}
              {briefing.macroSnapshot.inflationSignal ? (
                <MacroSnapshotCard $variant="inflation">
                  <MacroSnapshotLabel>물가/가격 압력</MacroSnapshotLabel>
                  <MacroSnapshotBody>
                    {renderMarked(briefing.macroSnapshot.inflationSignal)}
                  </MacroSnapshotBody>
                </MacroSnapshotCard>
              ) : null}
              {briefing.macroSnapshot.policySignal ? (
                <MacroSnapshotCard $variant="policy">
                  <MacroSnapshotLabel>정책·금리</MacroSnapshotLabel>
                  <MacroSnapshotBody>
                    {renderMarked(briefing.macroSnapshot.policySignal)}
                  </MacroSnapshotBody>
                </MacroSnapshotCard>
              ) : null}
              {briefing.macroSnapshot.liquiditySignal ? (
                <MacroSnapshotCard $variant="liquidity">
                  <MacroSnapshotLabel>유동성·수급</MacroSnapshotLabel>
                  <MacroSnapshotBody>
                    {renderMarked(briefing.macroSnapshot.liquiditySignal)}
                  </MacroSnapshotBody>
                </MacroSnapshotCard>
              ) : null}
            </MacroSnapshotGrid>
          </ContentCard>
        ) : null}

        {driverList.map((driver, idx) => {
          const narrativeVideoIds = driver.narratives.flatMap(
            (narrative) => narrative.videoIds ?? [],
          );
          return (
            <ContentCard key={`${driver.name}-${idx}`}>
              <SectionLabel>📊 거시 드라이버</SectionLabel>
              <SectionHeading>
                {`#${idx + 1} · ${driver.name ?? "드라이버"}`}
              </SectionHeading>
              {driver.indicatorFocus ? (
                <SectionParagraph>
                  {renderMarked(driver.indicatorFocus)}
                </SectionParagraph>
              ) : null}
              <SectionSubheading>핵심 내러티브</SectionSubheading>
              <MacroList>
                {driver.narratives.map((narrative, narrativeIdx) => (
                  <li key={`${driver.name}-narrative-${narrativeIdx}`}>
                    {renderMarked(narrative.text)}
                  </li>
                ))}
              </MacroList>
              {renderVideoGrid(narrativeVideoIds)}
            </ContentCard>
          );
        })}

        {sectorWatch.length ? (
          <ContentCard>
            <SectionLabel>🏭 산업/지역 시그널</SectionLabel>
            <SectionHeading>핵심 산업 뷰</SectionHeading>
            <MacroInfoGrid>
              {sectorWatch.map((sector, idx) => (
                <MacroInfoCard key={`${sector.segment}-${idx}`}>
                  <MacroInfoTitle>{sector.segment}</MacroInfoTitle>
                  <MacroList>
                    {sector.signals.map((signal, signalIdx) => (
                      <li key={`${sector.segment}-signal-${signalIdx}`}>
                        {renderMarked(signal)}
                      </li>
                    ))}
                  </MacroList>
                  {renderVideoGrid(sector.videoIds)}
                </MacroInfoCard>
              ))}
            </MacroInfoGrid>
          </ContentCard>
        ) : null}

        {policyItems.length ? (
          <ContentCard>
            <SectionLabel>🗓️ 정책·이벤트 캘린더</SectionLabel>
            <SectionHeading>주요 일정</SectionHeading>
            <MacroInfoGrid>
              {policyItems.map((item, idx) => (
                <MacroInfoCard key={`${item.title}-${idx}`}>
                  <MacroInfoTitle>{item.title}</MacroInfoTitle>
                  {item.when ? (
                    <MacroInfoMeta>{item.when}</MacroInfoMeta>
                  ) : null}
                  <MacroList>
                    {item.detail.map((line, lineIdx) => (
                      <li key={`${item.title}-detail-${lineIdx}`}>
                        {renderMarked(line)}
                      </li>
                    ))}
                  </MacroList>
                  {renderVideoGrid(item.videoIds)}
                </MacroInfoCard>
              ))}
            </MacroInfoGrid>
          </ContentCard>
        ) : null}

        {riskItems.length ? (
          <ContentCard>
            <SectionLabel>⚠️ 리스크</SectionLabel>
            <SectionHeading>핵심 위험 요인</SectionHeading>
            <MacroInfoGrid>
              {riskItems.map((item, idx) => (
                <MacroRiskCard key={`${item.title}-${idx}`}>
                  <MacroInfoTitle>{item.title}</MacroInfoTitle>
                  {item.impact ? (
                    <MacroImpactBadge>{item.impact}</MacroImpactBadge>
                  ) : null}
                  <MacroList>
                    {item.detail.map((line, lineIdx) => (
                      <li key={`${item.title}-risk-${lineIdx}`}>
                        {renderMarked(line)}
                      </li>
                    ))}
                  </MacroList>
                  {renderVideoGrid(item.videoIds)}
                </MacroRiskCard>
              ))}
            </MacroInfoGrid>
          </ContentCard>
        ) : null}

        {checklistItems.length ? (
          <ContentCard>
            <SectionLabel>📌 향후 체크포인트</SectionLabel>
            <SectionHeading>체크 리스트</SectionHeading>
            <ChecklistGrid>
              {checklistItems.map((item, idx) => (
                <ChecklistCard key={`${item.title}-${idx}`}>
                  <ChecklistTitle>{item.title}</ChecklistTitle>
                  <ChecklistList>
                    {item.detail.map((line, lineIdx) => (
                      <li key={`${item.title}-check-${lineIdx}`}>
                        {renderMarked(line)}
                      </li>
                    ))}
                  </ChecklistList>
                </ChecklistCard>
              ))}
            </ChecklistGrid>
          </ContentCard>
        ) : null}

        {renderEvidenceGallery(macroVideoIds)}

        {renderOutroSection()}
      </>
    );
  };

  const renderMarketPulseSection = () => {
    const pulse = briefing.marketPulse;
    if (!pulse) return null;
    const hasSignals = pulse.priceTrend || pulse.transactionTrend;
    return (
      <ContentCard>
        <SectionLabel>📌 시장 펄스</SectionLabel>
        <SectionHeading>핵심 흐름</SectionHeading>
        {pulse.summary ? (
          <PulseSummaryCard>{renderMarked(pulse.summary)}</PulseSummaryCard>
        ) : null}
        {hasSignals ? (
          <PulseHighlightGrid>
            {pulse.priceTrend ? (
              <PulseHighlightCard $variant="price">
                <SignalLabel>가격 흐름</SignalLabel>
                <SignalBody>{renderMarked(pulse.priceTrend)}</SignalBody>
              </PulseHighlightCard>
            ) : null}
            {pulse.transactionTrend ? (
              <PulseHighlightCard $variant="transaction">
                <SignalLabel>거래 흐름</SignalLabel>
                <SignalBody>{renderMarked(pulse.transactionTrend)}</SignalBody>
              </PulseHighlightCard>
            ) : null}
          </PulseHighlightGrid>
        ) : null}
      </ContentCard>
    );
  };

  const renderDemandSupplySection = () => {
    if (!briefing.demandSupply?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>⚖️ 수요·공급 포인트</SectionLabel>
        <SectionHeading>핵심 드라이버</SectionHeading>
        <DemandGrid>
          {briefing.demandSupply.map((item, idx) => (
            <DemandCard key={`${item.driver}-${idx}`}>
              <MacroInfoTitle>{item.driver}</MacroInfoTitle>
              {(item.regions?.length ?? 0) > 0 ||
              (item.propertyTypes?.length ?? 0) > 0 ? (
                <DemandMeta>
                  {item.regions?.length ? (
                    <MetaBadge>{item.regions.join(", ")}</MetaBadge>
                  ) : null}
                  {item.propertyTypes?.length ? (
                    <MetaBadge>{item.propertyTypes.join(", ")}</MetaBadge>
                  ) : null}
                </DemandMeta>
              ) : null}
              <BulletList>
                {item.impact.map((line, impactIdx) => (
                  <li key={`${item.driver}-impact-${impactIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </BulletList>
              {renderVideoGrid(item.videoIds)}
            </DemandCard>
          ))}
        </DemandGrid>
      </ContentCard>
    );
  };

  const renderPolicyFinanceSection = () => {
    if (!briefing.policyFinanceWatch?.items?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>🏛️ 정책·자금 환경</SectionLabel>
        <SectionHeading>
          {briefing.policyFinanceWatch.title || "핵심 정책 포인트"}
        </SectionHeading>
        <PolicyGrid>
          {briefing.policyFinanceWatch.items.map((item, idx) => (
            <PolicyCard key={`${item.title}-${idx}`}>
              <MacroInfoTitle>{item.title}</MacroInfoTitle>
              <BulletList>
                {item.detail.map((line, detailIdx) => (
                  <li key={`${item.title}-policy-${detailIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </BulletList>
              {renderVideoGrid(item.videoIds)}
            </PolicyCard>
          ))}
        </PolicyGrid>
      </ContentCard>
    );
  };

  const renderRegionalSpotlightSection = () => {
    if (!briefing.regionalSpotlight?.length) return null;
    return (
      <ContentCard>
        <SectionLabel>📍 지역 스포트라이트</SectionLabel>
        <SectionHeading>핵심 지역 동향</SectionHeading>
        <EcosystemGrid>
          {briefing.regionalSpotlight.map((region, idx) => (
            <EcosystemCard key={`${region.region}-${idx}`}>
              <MacroInfoTitle>{region.region}</MacroInfoTitle>
              <BulletList>
                {region.story.map((line, storyIdx) => (
                  <li key={`${region.region}-story-${storyIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </BulletList>
              {renderVideoGrid(region.videoIds)}
            </EcosystemCard>
          ))}
        </EcosystemGrid>
      </ContentCard>
    );
  };

  const renderRiskFlagsSection = () => {
    if (!briefing.riskFlags?.items?.length) return null;
    return (
      <ContentCard>
        <SectionHeading>
          ⚠️ {briefing.riskFlags.title || "리스크 플래그"}
        </SectionHeading>
        <RiskGrid>
          {briefing.riskFlags.items.map((flag, idx) => (
            <RiskCard key={`${flag.title}-${idx}`}>
              <RiskHeader>
                <MacroInfoTitle>{flag.title}</MacroInfoTitle>
                {flag.probability ? (
                  <RiskBadge>{flag.probability}</RiskBadge>
                ) : null}
              </RiskHeader>
              <RiskList>
                <li>{renderMarked(flag.detail)}</li>
              </RiskList>
              {renderVideoGrid(flag.videoIds)}
            </RiskCard>
          ))}
        </RiskGrid>
      </ContentCard>
    );
  };

  const renderShortTermWatchSection = () => {
    const section = briefing.shortTermWatch;
    if (!section?.items?.length) return null;
    return (
      <ContentCard>
        <SectionHeading>
          🔭 {section.title || "앞으로 2~3일 체크"}
        </SectionHeading>
        <ChecklistGrid>
          {section.items.map((item, idx) => (
            <ChecklistCard key={`${item.title}-${idx}`}>
              <ChecklistTitle>{item.title}</ChecklistTitle>
              <ChecklistList>
                {item.detail.map((line, detailIdx) => (
                  <li key={`${item.title}-watch-${detailIdx}`}>
                    {renderMarked(line)}
                  </li>
                ))}
              </ChecklistList>
            </ChecklistCard>
          ))}
        </ChecklistGrid>
      </ContentCard>
    );
  };

  const renderInnovationLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          {/* <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge> */}
        </HeroMeta>
        <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
        <HeroHeadline>{briefing.tldr.headline}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`ai-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {renderTechSnapshot()}

      {!briefing.techSnapshot && briefing.innovationPulseSummary ? (
        <ContentCard>
          <SectionHeading>⚡ 핵심 동향</SectionHeading>
          <SectionParagraph>
            {renderMarked(briefing.innovationPulseSummary)}
          </SectionParagraph>
        </ContentCard>
      ) : null}

      {briefing.modelWatch?.length ? (
        <ContentCard>
          <SectionHeading>🧠 주목 모델</SectionHeading>
          <ModelGrid>
            {briefing.modelWatch.map((item, idx) => (
              <ModelCard key={`${item.modelName}-${idx}`}>
                <ModelTitle>
                  {item.modelName}
                  {item.provider ? (
                    <ProviderBadge>{item.provider}</ProviderBadge>
                  ) : null}
                </ModelTitle>
                <ModelFocus>{item.focusArea}</ModelFocus>
                <BulletList>
                  {item.implication.map((line, impIdx) => (
                    <li key={`${item.modelName}-implication-${impIdx}`}>
                      {renderMarked(line)}
                    </li>
                  ))}
                </BulletList>
                {renderVideoGrid(item.videoIds)}
              </ModelCard>
            ))}
          </ModelGrid>
        </ContentCard>
      ) : null}

      {briefing.useCaseSpotlight?.length ? (
        <ContentCard>
          <SectionHeading>🛠️ 산업별 활용 사례</SectionHeading>
          <UseCaseGrid>
            {briefing.useCaseSpotlight.map((useCase, idx) => (
              <UseCaseCard key={`${useCase.industry}-${idx}`}>
                <UseCaseTitle>{useCase.industry}</UseCaseTitle>
                <UseCaseSubtitle>
                  {renderMarked(useCase.problemSolved)}
                </UseCaseSubtitle>
                <BulletList>
                  {useCase.result.map((line, resultIdx) => (
                    <li key={`${useCase.industry}-result-${resultIdx}`}>
                      {renderMarked(line)}
                    </li>
                  ))}
                </BulletList>
                {renderVideoGrid(useCase.videoIds)}
              </UseCaseCard>
            ))}
          </UseCaseGrid>
        </ContentCard>
      ) : null}

      {renderInnovationTracksSection()}
      {renderEcosystemWatchSection()}

      {(briefing.infraPolicyWatch?.items?.length ?? 0) > 0 ? (
        <ContentCard>
          <SectionLabel>🏛️ 인프라·정책 체크</SectionLabel>
          <SectionHeading>
            {briefing.infraPolicyWatch?.title || "핵심 인프라 이슈"}
          </SectionHeading>
          <PolicyGrid>
            {briefing.infraPolicyWatch?.items.map((policy, idx) => (
              <PolicyCard key={`${policy.topic}-${idx}`}>
                <MacroInfoTitle>{policy.topic}</MacroInfoTitle>
                <SectionParagraph>
                  {renderMarked(policy.detail)}
                </SectionParagraph>
                {policy.impact ? (
                  <PolicyImpact>
                    <strong>임팩트</strong>
                    <span>{renderMarked(policy.impact)}</span>
                  </PolicyImpact>
                ) : null}
                {renderVideoGrid(policy.videoIds)}
              </PolicyCard>
            ))}
          </PolicyGrid>
        </ContentCard>
      ) : null}

      {(briefing.riskEthics?.items?.length ?? 0) > 0 ? (
        <ContentCard>
          <SectionHeading>
            ⚠️ {briefing.riskEthics?.title || "리스크·윤리"}
          </SectionHeading>
          <RiskGrid>
            {briefing.riskEthics?.items.map((item, idx) => (
              <RiskCard key={`${item.title}-${idx}`}>
                <RiskHeader>
                  <MacroInfoTitle>{item.title}</MacroInfoTitle>
                  {item.severity ? (
                    <RiskBadge>{item.severity}</RiskBadge>
                  ) : null}
                </RiskHeader>
                <RiskList>
                  <li>{renderMarked(item.detail)}</li>
                </RiskList>
                {renderVideoGrid(item.videoIds)}
              </RiskCard>
            ))}
          </RiskGrid>
        </ContentCard>
      ) : null}

      {renderActionItemsSection()}

      {(briefing.nextSteps?.items?.length ?? 0) > 0 ? (
        <ContentCard>
          <SectionHeading>
            🔭 {briefing.nextSteps?.title || "앞으로 2~3일 체크"}
          </SectionHeading>
          <ChecklistGrid>
            {briefing.nextSteps?.items.map((item, idx) => (
              <ChecklistCard key={`${item.title}-${idx}`}>
                <ChecklistTitle>{item.title}</ChecklistTitle>
                <ChecklistList>
                  {item.detail.map((line, detailIdx) => (
                    <li key={`${item.title}-detail-${detailIdx}`}>
                      {renderMarked(line)}
                    </li>
                  ))}
                </ChecklistList>
                {item.relatedEntities?.length ? (
                  <RelatedEntities>
                    {item.relatedEntities.join(", ")}
                  </RelatedEntities>
                ) : null}
              </ChecklistCard>
            ))}
          </ChecklistGrid>
        </ContentCard>
      ) : null}

      {renderEvidenceGallery(referencedVideos)}

      {renderOutroSection()}
    </>
  );

  const renderRealEstateLayout = () => (
    <>
      <HeroCard>
        <HeroMeta>
          <span>{briefing.topicLabel}</span>
          {/* <HeroBadge>
            {briefing.dateBadge || deliveryMeta.displayLabel}
          </HeroBadge> */}
        </HeroMeta>
        <SummaryBadge>{briefing.summaryBadge || "요약"}</SummaryBadge>
        <HeroHeadline>{briefing.tldr.headline}</HeroHeadline>
        <HeroList>
          {briefing.tldr.bullets.map((bullet, idx) => (
            <li key={`realestate-tldr-${idx}`}>{renderMarked(bullet)}</li>
          ))}
        </HeroList>
      </HeroCard>

      {renderMarketPulseSection()}
      {renderDemandSupplySection()}
      {renderPolicyFinanceSection()}
      {renderRegionalSpotlightSection()}
      {renderRiskFlagsSection()}
      {renderShortTermWatchSection()}

      {renderEvidenceGallery(referencedVideos, { title: "🎬 근거 영상" })}

      {renderOutroSection()}
    </>
  );

  const hasMoneyLayout = Boolean(
    briefing.marketMood ||
      (briefing.themes?.length ?? 0) > 0 ||
      (briefing.tickerProfiles?.length ?? 0) > 0 ||
      (briefing.checklist?.length ?? 0) > 0,
  );

  const hasMacroLayout = Boolean(
    (briefing.macroDrivers?.length ?? 0) > 0 ||
    (briefing.macroPolicyWatch?.items?.length ?? 0) > 0 ||
    (briefing.macroSectorWatch?.length ?? 0) > 0 ||
    briefing.macroSnapshot,
  );

  const hasRealEstateLayout = Boolean(
    briefing.marketPulse ||
    (briefing.demandSupply?.length ?? 0) > 0 ||
    (briefing.policyFinanceWatch?.items?.length ?? 0) > 0 ||
    (briefing.regionalSpotlight?.length ?? 0) > 0 ||
    (briefing.riskFlags?.items?.length ?? 0) > 0 ||
    (briefing.shortTermWatch?.items?.length ?? 0) > 0,
  );

  const hasInnovationLayout = Boolean(
    briefing.techSnapshot ||
    briefing.innovationPulseSummary ||
    (briefing.modelWatch?.length ?? 0) > 0 ||
    (briefing.useCaseSpotlight?.length ?? 0) > 0 ||
    (briefing.innovationTracks?.length ?? 0) > 0 ||
    (briefing.ecosystemWatch?.length ?? 0) > 0 ||
    (briefing.infraPolicyWatch?.items?.length ?? 0) > 0 ||
    (briefing.riskEthics?.items?.length ?? 0) > 0 ||
    (briefing.nextSteps?.items?.length ?? 0) > 0,
  );

  const hasBusinessLayout = Boolean(
    (briefing.strategicMoves?.length ?? 0) > 0 ||
    (briefing.competitionWatch?.length ?? 0) > 0 ||
    (briefing.executionRisks?.items?.length ?? 0) > 0 ||
    (briefing.actionItems?.items?.length ?? 0) > 0,
  );

  const renderedLayout = hasMacroLayout
    ? renderMacroLayout()
    : hasRealEstateLayout
      ? renderRealEstateLayout()
      : hasInnovationLayout
        ? renderInnovationLayout()
        : hasMoneyLayout
          ? renderMoneyLayout()
          : hasBusinessLayout
            ? renderBusinessLayout()
            : renderLegacyLayout();

  const body = (
    <>
      {standalone ? (
        <HeaderWrapper>
          <LogoHeader />
        </HeaderWrapper>
      ) : null}
      <EmailContent>{renderedLayout}</EmailContent>
    </>
  );

  if (standalone) {
    return (
      <EmailPage>
        <VisuallyHidden aria-hidden>{briefing.preheader}</VisuallyHidden>
        {body}
      </EmailPage>
    );
  }

  return (
    <NonStandaloneContainer>
      <VisuallyHidden aria-hidden>{briefing.preheader}</VisuallyHidden>
      {body}
    </NonStandaloneContainer>
  );
};

export default EmailBriefingLanding;

const EmailPage = styled.div`
  min-height: 100vh;
  background: #f4f6f8;
  color: #111827;
`;

const NonStandaloneContainer = styled.div`
  width: 100%;
`;

const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(244, 246, 248, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
`;

const EmailContent = styled.main`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR",
    sans-serif;
`;

const HeroCard = styled.section`
  background: #fff;
  border-radius: 24px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
`;

const HeroMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #475569;
  font-weight: 700;
  margin-bottom: 12px;
`;

const HeroBadge = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1d4ed8;
  font-weight: 800;
`;

const SummaryBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: #ecfccb;
  color: #365314;
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 10px;
`;

const HeroHeadline = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  line-height: 1.4;
  color: #0f172a;
`;

const HeroList = styled.ul`
  margin: 18px 0 0;
  padding-left: 20px;
  font-size: 15px;
  line-height: 1.8;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style-type: disc;
`;

const ContentCard = styled.section`
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
`;

const SectionLabel = styled.p`
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 800;
  color: #1d4ed8;
`;

const SectionHeading = styled.h2`
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 900;
  margin-bottom: 8px;
  color: #0f172a;
`;

const SectionSubheading = styled.p`
  margin: 16px 0 0px;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
`;

const SectionParagraph = styled.p`
  margin: 0;
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.75;
  color: #374151;
`;

const BusinessSectionParagraph = styled(SectionParagraph)`
  margin-top: 0;
`;

const NarrativeList = styled.ul`
  margin: 18px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
`;

const VideoGrid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
`;

const MacroSnapshotGrid = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 16px;
`;

const MacroSnapshotCard = styled.div<{ $variant?: string }>`
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: ${({ $variant }) => {
    if ($variant === "growth") return "#ecfccb";
    if ($variant === "inflation") return "#fee2e2";
    if ($variant === "policy") return "#dbeafe";
    if ($variant === "liquidity") return "#cffafe";
    return "#f8fafc";
  }};
`;

const MacroSnapshotLabel = styled.p`
  margin: 0 0 6px 0;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
`;

const MacroSnapshotBody = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #0f172a;
`;

const MacroList = styled.ul`
  margin: 12px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
  list-style-position: outside;
`;

const MacroInfoGrid = styled.div`
  display: grid;
  width: 100%;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  justify-items: stretch;
`;

const MacroInfoCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
`;

const MacroInfoTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
`;

const MacroInfoMeta = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: #4338ca;
`;

const MacroRiskCard = styled(MacroInfoCard)`
  background: #fff7f7;
  border-color: #fecaca;
`;

const MacroImpactBadge = styled.span`
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 12px;
  font-weight: 700;
`;

const LandingEvidenceSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background: #fff;
  padding: 20px;
  margin-top: 18px;
`;

const LandingEvidenceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LandingEvidenceTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
`;

const LandingEvidenceList = styled(VideoSourceList)`
  margin-top: 4px;
`;

const VideoCard = styled.a`
  display: flex;
  gap: 12px;
  text-decoration: none;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid transparent;
  transition: border-color 0.2s ease;
  &:hover {
    border-color: #1d4ed8;
  }
`;

const VideoThumb = styled.div`
  flex: 0 0 120px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  background: #0f172a;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const VideoBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VideoTitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const VideoMeta = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const VideoAvatar = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoChannelText = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #64748b;
  strong {
    font-size: 12px;
    color: #0f172a;
  }
`;

const RiskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const OwnerBadge = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
`;

const OutroCard = styled(ContentCard)`
  text-align: center;
  background: #111827;
  color: #ffffff;
  border: none;
  box-shadow: none;
  border-radius: 18px;
  padding: 26px 24px;
`;

const OutroTitle = styled.p`
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 900;
`;

const OutroDescription = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.92);
`;

const OutroFootnote = styled.p`
  margin: 18px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
`;

const CtaButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  padding: 12px 26px;
  border-radius: 999px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
`;

const Mark = styled.span`
  background-color: #fff4cc;
  padding: 0 4px;
  border-radius: 4px;
  font-weight: 700;
`;

const VisuallyHidden = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const MoodSignalGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
`;

const MoodSignalCard = styled.div<{ $variant: "warning" | "info" }>`
  border-radius: 14px;
  padding: 14px;
  border: 1px solid
    ${({ $variant }) => ($variant === "warning" ? "#fef3c7" : "#bae6fd")};
  background: ${({ $variant }) =>
    $variant === "warning" ? "#fff7ed" : "#ecfeff"};
  p {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 800;
    color: ${({ $variant }) =>
      $variant === "warning" ? "#b45309" : "#0369a1"};
  }
  span {
    font-size: 14px;
    line-height: 1.6;
    color: #0f172a;
  }
`;

const TickerGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TickerCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const TickerHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TickerLabel = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
`;

const TickerBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 700;
`;

const TickerSubheading = styled.p`
  margin: 16px 0 6px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
`;

const BulletList = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
`;

const RiskGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RiskCard = styled.div`
  border: 1px solid #fee2e2;
  border-radius: 14px;
  padding: 18px;
  background: #fff7f7;
`;

const RiskBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
`;

const RiskList = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
`;

const ChecklistGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActionGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActionCard = styled.div`
  border: 1px solid #bae6fd;
  border-radius: 14px;
  padding: 18px;
  background: #f0f9ff;
`;

const ActionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const ActionOwnerPill = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
  font-weight: 700;
`;

const ChecklistCard = styled.div`
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 18px;
  background: #f0f9ff;
`;

const ChecklistTitle = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  color: #0f172a;
`;

const ChecklistList = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  list-style-type: disc;
`;

const SnapshotSignalGrid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const SnapshotSignalCard = styled.div<{
  $variant: "innovation" | "market" | "policy";
}>`
  border-radius: 14px;
  padding: 16px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "innovation"
        ? "#c7d2fe"
        : $variant === "market"
          ? "#a7f3d0"
          : "#fde68a"};
  background: ${({ $variant }) =>
    $variant === "innovation"
      ? "#eef2ff"
      : $variant === "market"
        ? "#ecfccb"
        : "#fef9c3"};
`;

const SignalLabel = styled.p`
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 800;
  color: #312e81;
`;

const SignalBody = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
`;

const PulseSummaryCard = styled.div`
  margin-top: 12px;
  border-radius: 14px;
  padding: 18px;
  background: #fff7f5;
  border: 1px solid #fecaca;
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
`;

const PulseHighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const PulseHighlightCard = styled.div<{ $variant: "price" | "transaction" }>`
  border-radius: 14px;
  padding: 16px;
  border: 1px solid
    ${({ $variant }) => ($variant === "price" ? "#fef3c7" : "#bae6fd")};
  background: ${({ $variant }) =>
    $variant === "price" ? "#fefce8" : "#ecfeff"};
`;

const DemandGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DemandCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DemandMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const MetaBadge = styled.span`
  padding: 3px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #312e81;
  font-size: 12px;
  font-weight: 700;
`;

const ModelGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ModelCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const ModelTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProviderBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1e40af;
  font-size: 11px;
  font-weight: 700;
`;

const ModelFocus = styled.p`
  margin: 10px 0 0;
  font-size: 14px;
  color: #64748b;
`;

const TrackMeta = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
`;

const TrackFocus = styled.span`
  font-weight: 600;
  color: #0f172a;
`;

const UseCaseGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const UseCaseCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const UseCaseTitle = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  color: #0f172a;
`;

const UseCaseSubtitle = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  color: #64748b;
`;

const PolicyGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PolicyCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const EcosystemGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EcosystemCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  background: #ffffff;
`;

const PolicyImpact = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff7ed;
  border: 1px solid #fef3c7;
  font-size: 14px;
  color: #92400e;
  strong {
    display: block;
    font-size: 12px;
    font-weight: 800;
    color: #b45309;
    margin-bottom: 4px;
  }
`;

const RelatedEntities = styled.p`
  margin: 12px 0 0;
  font-size: 13px;
  color: #64748b;
`;
