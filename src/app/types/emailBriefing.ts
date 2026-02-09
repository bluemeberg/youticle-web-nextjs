export interface EmailBriefingTldr {
  headline: string;
  bullets: string[];
}

export interface EmailBriefingNarrative {
  text: string;
  videoIds?: string[];
}

export interface EmailBriefingStrategicMove {
  name: string;
  whatHappened: string;
  whyImportant: string;
  narratives: EmailBriefingNarrative[];
}

export interface EmailBriefingExecutionRiskItem {
  title: string;
  detail?: string;
  details?: string[];
  owner?: string;
  videoIds?: string[];
}

export interface EmailBriefingExecutionRisks {
  title: string;
  items: EmailBriefingExecutionRiskItem[];
}

export interface EmailBriefingModelWatchItem {
  modelName: string;
  provider: string;
  focusArea: string;
  implication: string[];
  videoIds?: string[];
}

export interface EmailBriefingUseCaseItem {
  industry: string;
  problemSolved: string;
  result: string[];
  videoIds?: string[];
}

export interface EmailBriefingCompetitionWatchItem {
  name: string;
  detail?: string;
  signals?: string[];
  videoIds?: string[];
}

export interface EmailBriefingInnovationTrack {
  name: string;
  provider?: string;
  focusArea?: string;
  narratives: EmailBriefingNarrative[];
  impactMetrics?: string[];
  videoIds?: string[];
}

export interface EmailBriefingInfraPolicyItem {
  topic: string;
  detail: string;
  impact?: string;
  videoIds?: string[];
}

export interface EmailBriefingTechSnapshot {
  summary: string;
  marketSignal?: string;
  policySignal?: string;
  innovationSignal?: string;
}

export interface EmailBriefingEcosystemWatchItem {
  segment: string;
  signals: string[];
  videoIds?: string[];
}

export interface EmailBriefingActionItem {
  title: string;
  detail: string[];
  owners?: string[];
  videoIds?: string[];
}

export interface EmailBriefingActionItems {
  title?: string;
  items: EmailBriefingActionItem[];
}

export interface EmailBriefingMarketPulse {
  summary?: string;
  priceTrend?: string;
  transactionTrend?: string;
}

export interface EmailBriefingDemandSupplyItem {
  driver: string;
  impact: string[];
  regions?: string[];
  propertyTypes?: string[];
  videoIds?: string[];
}

export interface EmailBriefingPolicyFinanceItem {
  title: string;
  detail: string[];
  videoIds?: string[];
}

export interface EmailBriefingRegionalSpotlightItem {
  region: string;
  story: string[];
  videoIds?: string[];
}

export interface EmailBriefingRiskFlagItem {
  title: string;
  detail: string;
  probability?: string;
  videoIds?: string[];
}

export interface EmailBriefingShortTermWatchItem {
  title: string;
  detail: string[];
}

export interface EmailBriefingShortTermWatch {
  title?: string;
  items: EmailBriefingShortTermWatchItem[];
}

export interface EmailBriefingRiskEthicsItem {
  title: string;
  detail: string;
  severity?: string;
  videoIds?: string[];
}

export interface EmailBriefingNextStepItem {
  title: string;
  detail: string[];
  relatedEntities?: string[];
}

export interface EmailBriefingVideoMeta {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelThumbnail?: string;
  subscriberText?: string;
  summary?: string[];
  href: string;
}

export interface EmailMacroDriverNarrative {
  text: string;
  videoIds?: string[];
}

export interface EmailMacroDriver {
  name: string;
  indicatorFocus?: string;
  narratives: EmailMacroDriverNarrative[];
}

export interface EmailMacroPolicyWatchItem {
  title: string;
  detail: string[];
  when?: string;
  videoIds?: string[];
}

export interface EmailMacroPolicyWatch {
  title?: string;
  items: EmailMacroPolicyWatchItem[];
}

export interface EmailMacroRiskItem {
  title: string;
  detail: string[];
  impact?: string;
  videoIds?: string[];
}

export interface EmailMacroRiskSection {
  title?: string;
  items: EmailMacroRiskItem[];
}

export interface EmailMacroSectorWatchItem {
  segment: string;
  signals: string[];
  videoIds?: string[];
}

export interface EmailMacroSnapshot {
  summary?: string;
  growthSignal?: string;
  policySignal?: string;
  inflationSignal?: string;
  liquiditySignal?: string;
}

export interface EmailMacroChecklistItem {
  title: string;
  detail: string[];
}

export interface EmailMacroChecklistSection {
  title?: string;
  items: EmailMacroChecklistItem[];
}

export interface EmailBriefingOutro {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface EmailBriefingKeywordData {
  topicLabel: string;
  dateBadge: string;
  preheader: string;
  summaryBadge?: string;
  tldr: EmailBriefingTldr;
  strategicMoves: EmailBriefingStrategicMove[];
  executionRisks: EmailBriefingExecutionRisks;
  videos: Record<string, EmailBriefingVideoMeta>;
  topVideoIds?: string[];
  outro: EmailBriefingOutro;
  marketMood?: {
    summary?: string;
    flowSignal?: string;
    priceSignal?: string;
  };
  themes?: EmailBriefingStrategicMove[];
  tickerProfiles?: Array<{
    ticker?: string;
    companyName?: string;
    thesis?: string[];
    signals?: string[];
    videoIds?: string[];
  }>;
  checklist?: Array<{
    title: string;
    detail: string[];
  }>;
  innovationTracks?: EmailBriefingInnovationTrack[];
  modelWatch?: EmailBriefingModelWatchItem[];
  useCaseSpotlight?: EmailBriefingUseCaseItem[];
  infraPolicyWatch?: {
    title?: string;
    items: EmailBriefingInfraPolicyItem[];
  };
  riskEthics?: {
    title?: string;
    items: EmailBriefingRiskEthicsItem[];
  };
  nextSteps?: {
    title?: string;
    items: EmailBriefingNextStepItem[];
  };
  techSnapshot?: EmailBriefingTechSnapshot;
  ecosystemWatch?: EmailBriefingEcosystemWatchItem[];
  actionItems?: EmailBriefingActionItems;
  competitionWatch?: EmailBriefingCompetitionWatchItem[];
  marketPulse?: EmailBriefingMarketPulse;
  demandSupply?: EmailBriefingDemandSupplyItem[];
  policyFinanceWatch?: {
    title?: string;
    items: EmailBriefingPolicyFinanceItem[];
  };
  regionalSpotlight?: EmailBriefingRegionalSpotlightItem[];
  riskFlags?: {
    title?: string;
    items: EmailBriefingRiskFlagItem[];
  };
  shortTermWatch?: EmailBriefingShortTermWatch;
  innovationPulseSummary?: string;
  macroDrivers?: EmailMacroDriver[];
  macroPolicyWatch?: EmailMacroPolicyWatch;
  macroRiskSection?: EmailMacroRiskSection;
  macroSectorWatch?: EmailMacroSectorWatchItem[];
  macroSnapshot?: EmailMacroSnapshot;
  macroChecklist?: EmailMacroChecklistSection;
}
