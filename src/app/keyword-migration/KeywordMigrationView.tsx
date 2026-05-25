"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from "recoil";

import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { auth, signOut } from "@/firebase";
import { userState } from "@/store/user";
import {
  applyKeywordMigration,
  fetchSubscribedSubjects,
  getUserByEmail,
  KeywordMigrationPreview,
  logCtaClick,
} from "@/api/apiClient";
import { getOrCreateAnonId } from "@/utils/formatter";
import {
  APP_WIDTH,
  BRAND,
  FONT_STACK,
  RADIUS,
  SHADOW,
  SIGNAL,
  SPACING,
  SURFACE,
  TEXT,
} from "@/lib/tokens";

/* ──────────────────────────────────────────────────────────────────
 *  Canonical 8 — v7 SUPPORTED_KEYWORDS (백엔드와 일치)
 * ──────────────────────────────────────────────────────────────── */
type KeywordMeta = { label: string; icon: string; desc: string };
const KEYWORD_META: Record<string, KeywordMeta> = {
  "국내 주식": { label: "국내 주식", icon: "📈", desc: "KOSPI·KOSDAQ 시그널" },
  "해외 주식": { label: "해외 주식", icon: "🌍", desc: "미국·글로벌 증시" },
  "가상자산": { label: "가상자산", icon: "🪙", desc: "비트·이더·알트 트렌드" },
  "인공지능": { label: "인공지능", icon: "🤖", desc: "AI 산업·기술 동향" },
  "IT/테크": { label: "IT/테크", icon: "💻", desc: "테크 기업·제품 업데이트" },
  "부동산": { label: "부동산", icon: "🏢", desc: "분양·정책·시세" },
  "경제": { label: "경제", icon: "💵", desc: "거시 지표·경기 흐름" },
  "비즈니스/사업": { label: "비즈니스/사업", icon: "💼", desc: "산업·경영 전략" },
};

const SUPPORTED_ORDER = [
  "국내 주식",
  "해외 주식",
  "가상자산",
  "인공지능",
  "IT/테크",
  "부동산",
  "경제",
  "비즈니스/사업",
] as const;

const MAX_USER_PICKS = 3;

/* ──────────────────────────────────────────────────────────────────
 *  분류 정책 — 백엔드 keyword_migration_common.py 와 1:1 미러
 *  (운영 백엔드에 migration 전용 엔드포인트가 없으므로 클라에서 처리)
 * ──────────────────────────────────────────────────────────── */
const SUPPORTED_SET = new Set<string>(SUPPORTED_ORDER);

const RENAMED_MAP: Record<string, string[]> = {
  "주식": ["국내 주식", "해외 주식"],
  "가상자산": ["가상자산"],
  "국내 가상자산": ["가상자산"],
  "해외 가상자산": ["가상자산"],
};

const DROPPED_SET = new Set<string>([
  "뷰티/메이크업", "연애/결혼", "여행", "육아",
  "역사", "건강", "과학",
  "남자 패션", "여자 패션", "자동차",
  "피트니스", "정치", "요리",
]);

type ClassifyStatus = "kept" | "renamed" | "dropped";

function classifyKeyword(kw: string): { status: ClassifyStatus; mapped: string[] } {
  const k = kw.trim();
  if (SUPPORTED_SET.has(k)) return { status: "kept", mapped: [k] };
  if (k in RENAMED_MAP) return { status: "renamed", mapped: RENAMED_MAP[k] };
  return { status: "dropped", mapped: [] };
}

function classifyUserState(
  subs: string[],
): KeywordMigrationPreview["user_state"] {
  if (subs.length === 0) return "all_dropped";
  const statuses = subs.map((s) => classifyKeyword(s).status);
  const droppedCount = statuses.filter((s) => s === "dropped").length;
  const survivorCount = statuses.filter(
    (s) => s === "kept" || s === "renamed",
  ).length;
  if (droppedCount === statuses.length) return "all_dropped";
  if (survivorCount === statuses.length) {
    return statuses.some((s) => s === "renamed") ? "has_renamed" : "all_kept";
  }
  return "partial_dropped";
}

function buildPreviewFromSubjects(
  email: string,
  userId: number,
  subjects: string[],
): KeywordMigrationPreview {
  const kept: string[] = [];
  const renamed: KeywordMigrationPreview["renamed"] = [];
  const dropped: string[] = [];
  const autoSelected: string[] = [];
  for (const kw of subjects) {
    const { status, mapped } = classifyKeyword(kw);
    if (status === "kept") {
      kept.push(kw);
      for (const m of mapped) {
        if (!autoSelected.includes(m)) autoSelected.push(m);
      }
    } else if (status === "renamed") {
      renamed.push({ from: kw, to: mapped });
      for (const m of mapped) {
        if (!autoSelected.includes(m)) autoSelected.push(m);
      }
    } else {
      dropped.push(kw);
    }
  }
  return {
    user_id: userId,
    email,
    current_subjects: subjects,
    kept,
    renamed,
    dropped,
    auto_selected: autoSelected,
    supported: [...SUPPORTED_ORDER],
    user_state: classifyUserState(subjects),
  };
}

/* ──────────────────────────────────────────────────────────────── */

type LoadState = "idle" | "loading" | "ready" | "error";

/* ──────────────────────────────────────────────────────────────
 *  UserMenu — 우상단 계정 썸네일 + 드롭다운 (이메일 + 로그아웃)
 * ──────────────────────────────────────────────────────────── */
function UserMenu({
  user,
  onLogout,
}: {
  user: { name?: string | null; email?: string | null; picture?: string | null };
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <MenuWrap ref={wrapperRef}>
      <Avatar
        type="button"
        aria-label="내 계정"
        onClick={() => setOpen((v) => !v)}
      >
        {user.picture ? (
          <AvatarImg src={user.picture} alt="프로필" />
        ) : (
          <AvatarInitial>{initial}</AvatarInitial>
        )}
      </Avatar>
      {open && (
        <Dropdown>
          <DropdownLabel>로그인 계정</DropdownLabel>
          <DropdownEmail>{user.email ?? user.name ?? ""}</DropdownEmail>
          <DropdownLogout
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            이 기기에서 로그아웃
          </DropdownLogout>
        </Dropdown>
      )}
    </MenuWrap>
  );
}

export default function KeywordMigrationPage() {
  const user = useRecoilValue(userState);
  const setUser = useSetRecoilState(userState);
  const resetUser = useResetRecoilState(userState);

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.warn("[migration] signOut failed", e);
    }
    resetUser();
    setPreview(null);
    setState("idle");
    setSelected(new Set());
  };

  const [preview, setPreview] = useState<KeywordMigrationPreview | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 자동 매핑된 키워드 — 초기 체크용 (강제 아님, 사용자가 해제 가능)
  const autoSet = useMemo(
    () => new Set(preview?.auto_selected ?? []),
    [preview],
  );

  // 단일 선택 상태 — autoSet 으로 초기화, 사용자가 자유롭게 토글 (max 3)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);

  /* ----------------------- load preview -----------------------
   * 운영 백엔드에 migration 전용 엔드포인트가 없으므로, 기존
   * GET /users/subjects/{user_id} 를 사용해 구독 키워드만 받아오고
   * 분류(kept/renamed/dropped)는 클라이언트에서 수행한다.
   */
  const loadPreview = async (email: string) => {
    setState("loading");
    setErrorMsg("");
    try {
      const me = await getUserByEmail(email, user.name || null);
      const subjects = await fetchSubscribedSubjects(email, user.name || "");
      const next = buildPreviewFromSubjects(
        email,
        me?.id ?? user.id ?? 0,
        subjects,
      );
      setPreview(next);
      setSelected(new Set(next.auto_selected));
      setState("ready");
    } catch (e: any) {
      console.error("[migration-preview]", e);
      setErrorMsg(
        "구독 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
      setState("error");
    }
  };

  useEffect(() => {
    if (user?.email) loadPreview(user.email);
  }, [user?.email]);

  /* ----------------------- login handler ----------------------- */
  const handleLoginSuccess = async (gUser: {
    email: string;
    displayName: string;
    photoURL?: string;
  }) => {
    try {
      const me = await getUserByEmail(gUser.email, gUser.displayName);
      setUser({
        name: gUser.displayName,
        email: gUser.email,
        picture: gUser.photoURL ?? "",
        id: me.id,
      });
      await loadPreview(gUser.email);
    } catch (e) {
      console.error(e);
      setErrorMsg("로그인 처리 중 오류가 발생했어요.");
      setState("error");
    }
  };

  /* ----------------------- pick toggle ----------------------- */
  const togglePick = (kw: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) {
        next.delete(kw);
      } else {
        if (next.size >= MAX_USER_PICKS) return prev;
        next.add(kw);
      }
      return next;
    });
  };

  /* ----------------------- submit ----------------------- */
  const finalSubjects = useMemo(() => {
    return SUPPORTED_ORDER.filter((k) => selected.has(k));
  }, [selected]);

  const overLimit = selected.size > MAX_USER_PICKS;
  const canSubmit =
    !!user?.email &&
    finalSubjects.length > 0 &&
    !overLimit &&
    !submitting;

  const handleSubmit = async () => {
    if (!user?.email) return;
    if (finalSubjects.length === 0) {
      setErrorMsg("최소 1개의 키워드를 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      logCtaClick(
        "keyword_migration_apply",
        user?.id ?? null,
        user?.email ?? null,
        getOrCreateAnonId(),
      );
      await applyKeywordMigration(user.email, finalSubjects, {
        userId: preview?.user_id ?? user.id,
        currentSubjects: preview?.current_subjects,
        name: user.name || "",
      });
      setDoneOpen(true);
    } catch (e: any) {
      console.error("[migration-apply]", e);
      setErrorMsg(e?.message || "구독 변경에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────
   *  Render
   * ──────────────────────────────────────────────────────────── */

  const isAuthed = !!user?.email;
  const dropped = preview?.dropped ?? [];
  const renamed = preview?.renamed ?? [];
  const kept = preview?.kept ?? [];
  const hasDropped = dropped.length > 0;
  // 변경 여부 = 현재 선택이 자동 이전 결과(autoSet)와 다른지
  const hasChange =
    selected.size !== autoSet.size ||
    Array.from(selected).some((k) => !autoSet.has(k));
  const initialOverLimit = autoSet.size > MAX_USER_PICKS;
  const remainingPicks = Math.max(0, MAX_USER_PICKS - selected.size);

  // Hero — preview 로딩 전엔 중립 안내, 로딩 후엔 user_state별 분기
  const NEUTRAL_HERO = {
    title: (
      <>
        구독 키워드를
        <br />
        새 구조로 옮겨드려요
      </>
    ),
    sub: "구독 중인 키워드를 확인하고, 변경이 필요한 경우 새 키워드로 옮겨드려요. 시작하려면 구글 계정으로 로그인해 주세요.",
  };

  const HERO_COPY: Record<
    KeywordMigrationPreview["user_state"],
    { title: React.ReactNode; sub: string }
  > = {
    all_kept: {
      title: (
        <>
          구독 키워드에
          <br />
          변경이 없어요
        </>
      ),
      sub: `현재 구독은 새 시스템에서도 그대로 유지됩니다. 다른 키워드로 바꾸고 싶으면 아래에서 해제 후 새 키워드를 선택하세요. (최대 ${MAX_USER_PICKS}개)`,
    },
    has_renamed: {
      title: (
        <>
          구독이 자동으로
          <br />
          이전됐어요
        </>
      ),
      sub: `키워드 구조가 정리되며 일부 이름이 바뀌었습니다. 자동 이전 결과를 그대로 두거나, 해제 후 다른 키워드로 바꿀 수 있어요. (최대 ${MAX_USER_PICKS}개)`,
    },
    partial_dropped: {
      title: (
        <>
          일부 키워드가
          <br />
          종료돼요
        </>
      ),
      sub: `유지되는 키워드는 그대로 보내드리고, 종료된 자리는 새 키워드로 채워주세요. (최대 ${MAX_USER_PICKS}개)`,
    },
    all_dropped: {
      title: (
        <>
          구독 키워드를
          <br />
          새로 골라주세요
        </>
      ),
      sub: `기존 구독 키워드가 모두 종료됩니다. 새 키워드 중 ${MAX_USER_PICKS}개까지 선택해 주세요.`,
    },
  };
  const hero =
    preview && state === "ready" ? HERO_COPY[preview.user_state] : NEUTRAL_HERO;

  // 한도(3개) 단일 정책 — 자동 이전 + 사용자 선택 합산
  const chooseEyebrow = "CHOOSE";
  const chooseTitle = `구독 키워드 (최대 ${MAX_USER_PICKS}개)`;
  let chooseBody: string;
  if (initialOverLimit) {
    chooseBody = `자동 이전된 키워드가 한도(${MAX_USER_PICKS}개)를 초과합니다. 유지하지 않으실 키워드를 해제하고, 원하시면 다른 키워드로 교체하세요.`;
  } else if (hasDropped) {
    chooseBody = `종료된 ${dropped.length}개 키워드 자리에 새 키워드를 골라주세요. 자동 이전된 키워드를 해제하고 다른 키워드로 바꿀 수도 있어요.`;
  } else {
    chooseBody = `자동으로 이전된 구독을 그대로 두거나, 해제 후 다른 키워드로 교체하실 수 있어요. 합쳐서 최대 ${MAX_USER_PICKS}개까지 가능합니다.`;
  }

  let ctaCopy: string;
  if (submitting) ctaCopy = "저장 중…";
  else if (overLimit) ctaCopy = `${MAX_USER_PICKS}개 이하로 줄여주세요`;
  else if (finalSubjects.length === 0) ctaCopy = "키워드를 1개 이상 선택하세요";
  else if (!hasChange) ctaCopy = "현재 구독 유지하기";
  else ctaCopy = `키워드 ${finalSubjects.length}개로 변경하기`;

  // 그리드는 SUPPORTED 8개 전체 (자동 이전된 것도 해제 가능하도록 노출)
  const gridOptions = [...SUPPORTED_ORDER];

  return (
    <Page>
      <AppShell>
        <TopBar>
          <BadgeEyebrow>KEYWORD MIGRATION</BadgeEyebrow>
          {isAuthed && <UserMenu user={user} onLogout={handleLogout} />}
        </TopBar>

        {/* Hero — 상태별 분기 */}
        <Hero>
          <HeroTitle>{hero.title}</HeroTitle>
          <HeroSub>{hero.sub}</HeroSub>
        </Hero>

        {/* Auth gate */}
        {!isAuthed && (
          <Card>
            <CardEyebrow>STEP 1</CardEyebrow>
            <CardTitle>구글 계정 연동이 필요해요</CardTitle>
            <CardBody>
              구독자 정보를 불러오기 위해 가입에 사용하신 구글 계정으로 로그인해
              주세요.
            </CardBody>
            <GoogleSlot>
              <GoogleLogin onLoginSuccess={handleLoginSuccess} />
            </GoogleSlot>
          </Card>
        )}

        {isAuthed && state === "loading" && (
          <Card>
            <CardBody style={{ textAlign: "center", padding: SPACING.s24 }}>
              구독 정보를 불러오는 중…
            </CardBody>
          </Card>
        )}

        {isAuthed && state === "error" && (
          <Card>
            <CardBody style={{ color: SIGNAL.danger }}>{errorMsg}</CardBody>
            <PrimaryBtn
              onClick={() => user.email && loadPreview(user.email)}
              style={{ marginTop: SPACING.s12 }}
            >
              다시 시도
            </PrimaryBtn>
          </Card>
        )}

        {isAuthed && state === "ready" && preview && (
          <>
            {/* 현재 구독 — 변경 후 적용될 키워드 위주 + (있을 때만) 종료 안내 */}
            {(kept.length > 0 ||
              renamed.length > 0 ||
              dropped.length > 0) && (
              <Card>
                <CardEyebrow>MY SUBSCRIPTION</CardEyebrow>
                <CardTitle>현재 구독</CardTitle>

                {(kept.length > 0 || renamed.length > 0) && (
                  <Block>
                    <BlockHeader $tone="ok">
                      <Dot $color={SIGNAL.success} />
                      계속 받아보실 키워드
                    </BlockHeader>
                    <BlockList>
                      {kept.map((kw) => (
                        <Row key={`kept-${kw}`}>
                          <RowFrom>{kw}</RowFrom>
                          <RowArrow>→</RowArrow>
                          <RowTo>
                            <strong>{kw}</strong>
                            <RowToHint>유지</RowToHint>
                          </RowTo>
                        </Row>
                      ))}
                      {renamed.map(({ from, to }) => (
                        <Row key={`renamed-${from}`}>
                          <RowFrom>{from}</RowFrom>
                          <RowArrow>→</RowArrow>
                          <RowTo>
                            <strong>{to.join(" + ")}</strong>
                            {to.length > 1 && (
                              <BonusBadge>둘로 분리</BonusBadge>
                            )}
                          </RowTo>
                        </Row>
                      ))}
                    </BlockList>
                  </Block>
                )}

                {hasDropped && (
                  <Block>
                    <BlockHeader $tone="muted">
                      <Dot $color={TEXT.muted} />
                      더 이상 보내지 않는 키워드
                    </BlockHeader>
                    <ChipsWrap>
                      {dropped.map((kw) => (
                        <DroppedChip key={kw}>{kw}</DroppedChip>
                      ))}
                    </ChipsWrap>
                    <BlockNote>
                      더 깊은 분석을 위해 위 키워드는 브리핑이 종료돼요.
                      필요하시면 아래에서 다른 키워드로 대체하실 수 있어요.
                    </BlockNote>
                  </Block>
                )}
              </Card>
            )}

            {/* 키워드 선택 — 단일 한도(3개) 안에서 자유 토글 */}
            <Card>
              <CardEyebrow>{chooseEyebrow}</CardEyebrow>
              <CardTitle>{chooseTitle}</CardTitle>
              <CardBody>{chooseBody}</CardBody>

              <Counter $warn={overLimit}>
                <CounterMain>
                  선택 {selected.size}/{MAX_USER_PICKS}
                </CounterMain>
                {overLimit && (
                  <CounterAuto>
                    {selected.size - MAX_USER_PICKS}개 초과 — 해제 후 저장 가능
                  </CounterAuto>
                )}
                {!overLimit && remainingPicks > 0 && (
                  <CounterAuto>{remainingPicks}자리 남음</CounterAuto>
                )}
              </Counter>

              <Grid>
                {gridOptions.map((kw) => {
                  const meta = KEYWORD_META[kw];
                  const picked = selected.has(kw);
                  const isAuto = autoSet.has(kw);
                  const disabled = !picked && remainingPicks <= 0;
                  return (
                    <Tile
                      key={kw}
                      $selected={picked}
                      $auto={false}
                      $disabled={disabled}
                      onClick={() => !disabled && togglePick(kw)}
                      role="button"
                      aria-pressed={picked}
                      aria-disabled={disabled}
                    >
                      <TileHead>
                        <TileIcon>{meta.icon}</TileIcon>
                      </TileHead>
                      <TileLabel>
                        {meta.label}
                        {isAuto && <AutoTag>자동</AutoTag>}
                      </TileLabel>
                      <TileDesc>{meta.desc}</TileDesc>
                      <Check $selected={picked}>{picked ? "✓" : ""}</Check>
                    </Tile>
                  );
                })}
              </Grid>
            </Card>

            {errorMsg && <ErrorBanner>{errorMsg}</ErrorBanner>}
          </>
        )}

        <Spacer />
      </AppShell>

      {/* Sticky bottom CTA */}
      {isAuthed && state === "ready" && (
        <StickyBar>
          <StickyInner>
            <PickSummary>
              {finalSubjects.length === 0
                ? "구독할 키워드를 1개 이상 선택하세요"
                : `적용 후 구독 · ${finalSubjects.join(" / ")}`}
            </PickSummary>
            <PrimaryBtn disabled={!canSubmit} onClick={handleSubmit}>
              {ctaCopy}
            </PrimaryBtn>
          </StickyInner>
        </StickyBar>
      )}

      {/* Done modal */}
      {doneOpen && (
        <ModalBackdrop>
          <ModalCard>
            <ModalEyebrow>SAVED</ModalEyebrow>
            <ModalTitle>감사합니다</ModalTitle>
            <ModalBody>
              {hasChange
                ? "구독 키워드가 변경됐어요. 다음 브리핑부터 새 키워드로 받아보실 수 있어요."
                : "현재 구독이 그대로 유지됩니다."}
            </ModalBody>
            <PrimaryBtn
              onClick={() => setDoneOpen(false)}
              style={{ width: "100%", marginTop: SPACING.s16 }}
            >
              확인
            </PrimaryBtn>
          </ModalCard>
        </ModalBackdrop>
      )}
    </Page>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Styled
 * ──────────────────────────────────────────────────────────── */

const Page = styled.div`
  min-height: 100vh;
  background: ${SURFACE.page};
  color: ${TEXT.heading};
  font-family: ${FONT_STACK};
  -webkit-font-smoothing: antialiased;
  padding-bottom: 120px;
`;

const AppShell = styled.div`
  max-width: ${APP_WIDTH}px;
  margin: 0 auto;
  padding: ${SPACING.s12}px ${SPACING.s16}px ${SPACING.s32}px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
`;

const BadgeEyebrow = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: ${BRAND.primary};
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;

const MenuWrap = styled.div`
  position: relative;
`;

const Avatar = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${RADIUS.pill}px;
  border: 1.5px solid ${SURFACE.border};
  background: ${SURFACE.card};
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarInitial = styled.span`
  font-size: 13px;
  font-weight: 900;
  color: ${TEXT.sub};
`;

const Dropdown = styled.div`
  position: absolute;
  right: 0;
  top: 38px;
  min-width: 220px;
  background: ${SURFACE.card};
  border: 1px solid ${SURFACE.border};
  border-radius: ${RADIUS.lg}px;
  box-shadow: ${SHADOW.card};
  z-index: 70;
  padding: ${SPACING.s10}px ${SPACING.s12}px;
`;

const DropdownLabel = styled.p`
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: ${TEXT.placeholder};
  letter-spacing: -0.01em;
`;

const DropdownEmail = styled.p`
  margin: ${SPACING.s2}px 0 ${SPACING.s10}px;
  font-size: 13px;
  font-weight: 700;
  color: ${TEXT.heading};
  word-break: break-all;
  line-height: 1.3;
`;

const DropdownLogout = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.s6}px;
  padding: ${SPACING.s8}px ${SPACING.s10}px;
  border-radius: ${RADIUS.md}px;
  border: 1px solid ${SURFACE.border};
  background: ${SURFACE.card};
  color: ${TEXT.sub};
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  font-family: ${FONT_STACK};
  &:hover {
    background: ${SURFACE.subtle};
  }
`;

const Hero = styled.section`
  padding: ${SPACING.s20}px 0 ${SPACING.s24}px;
`;

const HeroTitle = styled.h1`
  margin: 0 0 ${SPACING.s12}px;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: -0.04em;
  color: ${TEXT.heading};
  word-break: keep-all;
`;

const HeroSub = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  letter-spacing: -0.01em;
  color: ${TEXT.body};
  word-break: keep-all;
`;

const Card = styled.section`
  background: ${SURFACE.card};
  border: 1px solid ${SURFACE.border};
  border-radius: ${RADIUS.xl}px;
  padding: ${SPACING.s20}px;
  margin-top: ${SPACING.s16}px;
`;

const CardEyebrow = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${BRAND.primary};
  margin-bottom: ${SPACING.s8}px;
`;

const CardTitle = styled.h2`
  margin: 0 0 ${SPACING.s8}px;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: ${TEXT.heading};
  word-break: keep-all;
`;

const CardBody = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  letter-spacing: -0.01em;
  color: ${TEXT.body};
  word-break: keep-all;
`;

const GoogleSlot = styled.div`
  margin-top: ${SPACING.s16}px;
`;

const Block = styled.div`
  margin-top: ${SPACING.s16}px;
`;

const BlockHeader = styled.div<{ $tone: "ok" | "muted" }>`
  display: flex;
  align-items: center;
  gap: ${SPACING.s6}px;
  margin-bottom: ${SPACING.s8}px;
  font-size: 13px;
  font-weight: 800;
  color: ${({ $tone }) => ($tone === "ok" ? TEXT.heading : TEXT.muted)};
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: inline-block;
`;

const BlockList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid ${SURFACE.border};
  border-radius: ${RADIUS.lg}px;
  overflow: hidden;
`;

const Row = styled.li`
  display: grid;
  grid-template-columns: 1fr 20px 1.4fr;
  gap: ${SPACING.s8}px;
  align-items: center;
  padding: ${SPACING.s12}px ${SPACING.s14}px;
  background: ${SURFACE.card};
  & + & {
    border-top: 1px solid ${SURFACE.border};
  }
`;

const RowFrom = styled.span`
  font-size: 13px;
  color: ${TEXT.muted};
  text-decoration: line-through;
  text-decoration-color: ${TEXT.disabled};
`;

const RowArrow = styled.span`
  text-align: center;
  color: ${TEXT.muted};
  font-size: 13px;
`;

const RowTo = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${SPACING.s6}px;
  font-size: 14px;
  color: ${TEXT.heading};
  strong {
    font-weight: 800;
  }
`;

const RowToHint = styled.span`
  font-size: 11px;
  color: ${TEXT.muted};
  font-weight: 700;
`;

const BonusBadge = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: ${BRAND.primary};
  background: ${BRAND.primaryTint};
  padding: 2px 8px;
  border-radius: ${RADIUS.pill}px;
`;

const ChipsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACING.s6}px;
`;

const DroppedChip = styled.span`
  font-size: 12px;
  color: ${TEXT.muted};
  background: ${SURFACE.subtle};
  border: 1px solid ${SURFACE.border};
  padding: 4px 10px;
  border-radius: ${RADIUS.pill}px;
  text-decoration: line-through;
  text-decoration-color: ${TEXT.disabled};
`;

const BlockNote = styled.p`
  margin: ${SPACING.s8}px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: ${TEXT.muted};
  word-break: keep-all;
`;

const Counter = styled.div<{ $warn?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: ${SPACING.s16}px 0 ${SPACING.s12}px;
  padding: ${SPACING.s10}px ${SPACING.s12}px;
  background: ${({ $warn }) => ($warn ? SIGNAL.dangerTint : SURFACE.subtle)};
  border: 1px solid
    ${({ $warn }) => ($warn ? SIGNAL.danger : "transparent")};
  border-radius: ${RADIUS.lg}px;
`;

const CounterMain = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${TEXT.heading};
  letter-spacing: -0.01em;
`;

const CounterAuto = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${BRAND.primary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${SPACING.s10}px;
`;

const Tile = styled.button<{
  $selected: boolean;
  $auto: boolean;
  $disabled: boolean;
}>`
  position: relative;
  text-align: left;
  background: ${({ $selected }) =>
    $selected ? BRAND.primaryTint : SURFACE.card};
  border: 1.5px solid
    ${({ $selected, $auto }) =>
      $auto
        ? BRAND.primary
        : $selected
        ? BRAND.primary
        : SURFACE.border};
  border-radius: ${RADIUS.lg}px;
  padding: ${SPACING.s12}px;
  cursor: ${({ $disabled, $auto }) =>
    $auto ? "default" : $disabled ? "not-allowed" : "pointer"};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  transition: border-color 0.12s, background 0.12s;
  font-family: ${FONT_STACK};
  &:hover {
    border-color: ${({ $disabled, $auto, $selected }) =>
      $auto || $selected || $disabled ? undefined : BRAND.primary};
  }
`;

const TileHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${SPACING.s4}px;
`;

const TileIcon = styled.span`
  font-size: 18px;
`;

const TileLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.s6}px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: ${TEXT.heading};
  margin-bottom: ${SPACING.s2}px;
`;

const AutoTag = styled.span`
  display: inline-block;
  font-size: 9.5px;
  font-weight: 800;
  color: ${BRAND.primary};
  background: ${BRAND.primaryTint};
  padding: 1px 6px;
  border-radius: ${RADIUS.pill}px;
  letter-spacing: 0;
`;

const TileDesc = styled.div`
  font-size: 11px;
  line-height: 1.45;
  color: ${TEXT.muted};
  letter-spacing: -0.01em;
  word-break: keep-all;
`;

const Check = styled.div<{ $selected: boolean }>`
  position: absolute;
  top: ${SPACING.s10}px;
  right: ${SPACING.s10}px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ $selected }) =>
    $selected ? BRAND.primary : "transparent"};
  border: 1.5px solid
    ${({ $selected }) => ($selected ? BRAND.primary : SURFACE.border)};
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorBanner = styled.div`
  margin-top: ${SPACING.s12}px;
  padding: ${SPACING.s12}px ${SPACING.s14}px;
  border: 1px solid ${SIGNAL.danger};
  background: ${SIGNAL.dangerTint};
  color: ${SIGNAL.danger};
  border-radius: ${RADIUS.lg}px;
  font-size: 13px;
  font-weight: 700;
`;

const Spacer = styled.div`
  height: ${SPACING.s32}px;
`;

const StickyBar = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${SURFACE.card};
  border-top: 1px solid ${SURFACE.border};
  box-shadow: ${SHADOW.nav};
  padding: ${SPACING.s12}px ${SPACING.s16}px ${SPACING.s20}px;
`;

const StickyInner = styled.div`
  max-width: ${APP_WIDTH}px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${SPACING.s8}px;
`;

const PickSummary = styled.div`
  font-size: 12px;
  color: ${TEXT.muted};
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PrimaryBtn = styled.button`
  background: ${BRAND.primary};
  color: #fff;
  border: none;
  border-radius: ${RADIUS.lg}px;
  padding: ${SPACING.s14}px ${SPACING.s20}px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.02em;
  cursor: pointer;
  font-family: ${FONT_STACK};
  box-shadow: ${SHADOW.button};
  &:hover:not(:disabled) {
    background: ${BRAND.primaryHover};
  }
  &:disabled {
    background: ${SURFACE.subtle};
    color: ${TEXT.disabled};
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(23, 23, 25, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: ${SPACING.s20}px;
`;

const ModalCard = styled.div`
  background: ${SURFACE.card};
  border-radius: ${RADIUS["2xl"]}px;
  padding: ${SPACING.s24}px;
  width: 100%;
  max-width: 360px;
  box-shadow: ${SHADOW.lift};
`;

const ModalEyebrow = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${SIGNAL.success};
  margin-bottom: ${SPACING.s8}px;
`;

const ModalTitle = styled.h3`
  margin: 0 0 ${SPACING.s8}px;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: ${TEXT.heading};
`;

const ModalBody = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: ${TEXT.body};
`;
