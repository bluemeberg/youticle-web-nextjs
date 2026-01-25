"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useRouter, usePathname } from "next/navigation";
import { auth, signOut } from "@/firebase";
import { userState } from "@/store/user";
import { playerState } from "@/store/player";
import BackIcon from "@/assets/back.svg";
import YoutubeOffIcon from "@/assets/youtubeOff.svg";
import YoutubeOnIcon from "@/assets/youtubeOn2.svg";
import MenuIcon from "@/assets/menu_icon.svg";
import ShareIcon from "@/assets/share.svg";
import Toast from "./Toast";
import { isDesktop } from "react-device-detect";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getUserByEmail, logCtaClick } from "@/api/apiClient";
import { getOrCreateAnonId, removeMarkTags } from "@/utils/formatter";

interface LogoHeaderProps {
  title?: string;
  onBack?: () => void; // 뒤로가기 핸들러 추가
  onBackHome?: () => void;
  showLogo?: boolean;
  forceLightTheme?: boolean;
}

const LogoHeader = ({
  title = "",
  onBack,
  onBackHome,
  showLogo = false,
  forceLightTheme = false,
}: LogoHeaderProps) => {
  const user = useRecoilValue(userState);
  const setUser = useSetRecoilState(userState);
  const player = useRecoilValue(playerState);
  const setPlayer = useSetRecoilState(playerState);
  const [toastVisible, setToastVisible] = useState(false);
  const [logoutBtnVisible, setLogoutBtnVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClientDesktop, setIsClientDesktop] = useState(false);
  const [showPlayerOnboarding, setShowPlayerOnboarding] = useState(false);
  const [archiveNoticeOpen, setArchiveNoticeOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isDetailPage =
    pathname.includes("/detail") ||
    pathname.startsWith("/editor/") ||
    pathname.startsWith("/samplePage") ||
    pathname.startsWith("/keyword/") ||
    pathname.startsWith("/studio/");

  const isEvidencePage = pathname.startsWith("/evidence");

  const shouldShowPlayerOnboarding =
    isDetailPage && !isEvidencePage && Boolean(title);

  const trackPlayerOnboardingEvent = useCallback(
    (event: string) => {
      void logCtaClick(event, user?.id, user?.email, getOrCreateAnonId()).catch(
        () => {}
      );
    },
    [user?.id, user?.email]
  );

  const persistPlayerOnboardingState = useCallback((dismissed: boolean) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "player-toggle-onboarding",
        dismissed ? "true" : "false"
      );
    } catch {
      /* ignore */
    }
  }, []);

  const completePlayerOnboarding = useCallback(() => {
    setShowPlayerOnboarding(false);
    persistPlayerOnboardingState(true);
    trackPlayerOnboardingEvent("player_onboarding_complete");
  }, [persistPlayerOnboardingState, trackPlayerOnboardingEvent]);

  const isUnsubscribeOrModifyPage =
    pathname.endsWith("/unsubscribe") || pathname.endsWith("/subject/modify");

  const shouldUseLightTheme =
    forceLightTheme ||
    isDetailPage ||
    isEvidencePage ||
    isUnsubscribeOrModifyPage;

  const shouldShowBackIcon =
    Boolean(onBack) ||
    pathname.endsWith("/unsubscribe") ||
    isDetailPage ||
    isEvidencePage ||
    isUnsubscribeOrModifyPage;

  const previousPage = useRef<string | null>(null);

  useEffect(() => {
    // 페이지 최초 접근 시, 현재 경로 저장
    if (pathname.includes("/unsubscribe")) {
      previousPage.current = "/unsubscribe";
    }
  }, [pathname]);

  useEffect(() => {
    if (!shouldShowPlayerOnboarding) return;
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("player-toggle-onboarding");
      if (stored !== "true") {
        setShowPlayerOnboarding(true);
      }
    } catch {
      setShowPlayerOnboarding(true);
    }
  }, [shouldShowPlayerOnboarding]);

  useEffect(() => {
    if (!showPlayerOnboarding) return;
    trackPlayerOnboardingEvent("player_onboarding_view");
  }, [showPlayerOnboarding, trackPlayerOnboardingEvent]);

  const handleBackClick = () => {
    // 📌 직접 진입된 스튜디오 채널 상세 페이지
    const directStudioDetail = /^\/studio\/channel\/@[^/]+\/[^/]+$/;
    // 📌 직접 진입된 아카이브 페이지
    const directStudioArchive = pathname === "/studio/archive";

    if (
      (directStudioDetail.test(pathname) || directStudioArchive) &&
      window.history.length <= 1
    ) {
      router.push("/studio");
      return;
    }
    // 1) 클릭 로그 전송
    logCtaClick(
      "back_button_click",
      user?.id,
      user?.email,
      getOrCreateAnonId()
    );
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "back_button_click", {
        event_category: "navigation",
        event_label: "Back Button",
        page_path: pathname,
      });
    }

    if (onBack) {
      onBack(); // 부모 컴포넌트에서 정의된 핸들러 실행
      return;
    }

    if (pathname.includes("/detail/")) {
      router.push("/");
    } else if (
      pathname.includes("/detail") &&
      previousPage.current === "/unsubscribe"
    ) {
      router.push("/unsubscribe");
    } else if (pathname.endsWith("/subject/modify")) {
      router.push("/");
    } else if (pathname.startsWith("/studio")) {
      // 스튜디오 내부 페이지는 히스토리 스택이 있으면 뒤로가기, 아니면 /studio 메인으로
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/studio");
      }
    } else {
      router.back();
    }
  };

  const copyUrlToClipboard = () => {
    const currentUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(currentUrl)
        .then(() => {
          setToastVisible(true);
          setTimeout(() => setToastVisible(false), 2000);
        })
        .catch((err) => {
          console.error("URL 복사에 실패했습니다.", err);
        });
    } else {
      console.warn("이 브라우저는 Clipboard API를 지원하지 않습니다.");
    }
  };

  const togglePlayerVisible = () => {
    setPlayer(!player);
    if (showPlayerOnboarding) {
      completePlayerOnboarding();
    }
  };

  const handlePlayerOnboardingGotIt = () => {
    trackPlayerOnboardingEvent("player_onboarding_got_it");
    completePlayerOnboarding();
  };

  const handlePlayerOnboardingLater = () => {
    setShowPlayerOnboarding(false);
    persistPlayerOnboardingState(false);
    trackPlayerOnboardingEvent("player_onboarding_later");
  };

  const goToPage = (url: string) => router.push(url);

  const goHome = () => {
    if (pathname.startsWith("/editor/")) goToPage("/editor");
    else if (pathname.startsWith("/studio/")) goToPage("/studio");
    else if (pathname.startsWith("/samplePage")) goToPage("/my");
    else if (pathname.startsWith("/keyword/")) goToPage("/my");
    else goToPage("/today");
  };

  const provider = new GoogleAuthProvider();
  // provider.addScope("https://www.googleapis.com/auth/youtube.readonly");

  const GoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const data = await getUserByEmail(
        result.user.email,
        result.user.displayName
      );
      const normalizedUser = {
        name: result.user.displayName,
        email: result.user.email,
        picture: result.user.photoURL,
        id: data.id,
      };
      setUser(normalizedUser);
      return normalizedUser;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const GoogleLogOut = async () => {
    try {
      await signOut(auth);
      setUser({
        name: "",
        email: "",
        picture: "",
      });
      setMenuOpen(false);
    } catch (e) {
      console.error("Error logging out:", e);
    }
  };

  const handleAuth = async (isLoggedIn: boolean) => {
    if (!isLoggedIn) await GoogleLogin();
    else await GoogleLogOut();
  };

  const handleLogoClick = () => {
    // 1) 클릭 로그 전송
    logCtaClick("logo_click", user?.id, user?.email, getOrCreateAnonId());
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "logo_click", {
        event_category: "navigation",
        event_label: "Logo",
        page_path: pathname,
      });
    }
    if (onBackHome) {
      console.log("hello, back home");
      onBackHome(); // 부모 컴포넌트에서 정의된 핸들러 실행
      return;
    }
    router.push("/");
  };

  const handleClickProfile = () => setMenuOpen((prev) => !prev);

  const handleMenuClick = () => {
    logCtaClick("menu_click", user?.id, user?.email, getOrCreateAnonId());
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "menu_open", {
        event_category: "interaction",
        event_label: "Menu Open",
        page_path: pathname,
      });
    }
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    setIsClientDesktop(isDesktop);
  }, []);
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingText, setLoadingText] = useState(""); // 로딩 메시지 상태 추가
  const handleMenuNavigation = (url: string, loadingMessage?: string) => {
    setMenuOpen(false);
    if (pathname === url) {
      router.push(url);
      return;
    }

    setLoadingText(loadingMessage || "로딩 중..."); // 로딩 메시지 설정
    setLoadingPage(true); // 로딩 상태 활성화
    setTimeout(() => {
      router.push(url);
      // setLoadingPage(false); // 페이지 이동 후 로딩 상태 해제
    }, 500); // UI 자연스럽게 변경을 위해 0.8초 딜레이
  };

  const handleArchiveShortcut = async () => {
    logCtaClick(
      "archive_cta_click",
      user?.id ?? null,
      user?.email ?? undefined,
      getOrCreateAnonId(),
      { origin: "header_profile" }
    );
    setMenuOpen(false);
    if (!user.email) {
      const loggedInUser = await GoogleLogin();
      if (!loggedInUser?.email) {
        return;
      }
    }
    setArchiveNoticeOpen(true);
  };

  const handleLogoutShortcut = async () => {
    await GoogleLogOut();
  };

  const handleProfileMenuNavigation = (item: (typeof MENU_ITEMS_ALL)[number]) => {
    handleMenuNavigation(item.href, item.loadingMsg);
  };

  const MENU_ITEMS_ALL = [
    {
      icon: "🎬",
      label: "요약 스튜디오",
      href: "/studio",
      loadingMsg: "스튜디오 로딩 중...",
    },
    {
      icon: "🏠",
      label: "유티클 브리핑",
      href: "/",
      loadingMsg: "브리핑 로딩 중...",
    },
    {
      icon: "📂",
      label: "내 아카이브",
      href: "/studio/archive",
      loadingMsg: "아카이브 로딩 중...",
    },
    // {
    //   icon: "✍️",
    //   label: "에디터 픽",
    //   href: "/editor",
    //   loadingMsg: "에디터 픽 로딩 중...",
    // },
    // {
    //   icon: "ℹ️",
    //   label: "소개",
    //   href: "/about",
    //   loadingMsg: "소개 페이지 로딩 중...",
    // },
  ];
  // ✅ 권한 체크: 지정된 id만 확장 메뉴 노출
  const privilegedIds = new Set<number>([3, 4, 5, 6, 7, 9, 58]);
  const isPrivileged = privilegedIds.has(Number(user?.id));
  // ✅ 누구나 볼 수 있는 기본 메뉴: 유티클 브리핑만
  //    권한 있는 사용자만 나머지(스튜디오/아카이브) 추가
  const VISIBLE_MENU_ITEMS = [
    MENU_ITEMS_ALL[1], // 유티클 브리핑
    ...(isPrivileged ? [MENU_ITEMS_ALL[0], MENU_ITEMS_ALL[2]] : []),
  ];
  const shouldRenderDefaultLogoSlot = !showLogo && title === "";
  const canShowMenuSection =
    !pathname.includes("/detail") &&
    !pathname.startsWith("/editor/") &&
    !pathname.startsWith("/studio/");

  return (
    <>
      <Container
        $isDetailPage={shouldUseLightTheme}
        $isDesktop={isClientDesktop}
        $isUnsubscribeOrModifyPage={isUnsubscribeOrModifyPage} // unsubscribe 페이지 스타일 적용
      >
        <PageInfo>
          {shouldShowBackIcon && <BackIcon onClick={handleBackClick} />}
          {shouldRenderDefaultLogoSlot ? (
            <span onClick={handleLogoClick} className="logo">
              YouTicle
            </span>
          ) : (
            <TitleGroup>
              {showLogo ? (
                <LogoButton type="button" onClick={handleLogoClick}>
                  YouTicle
                </LogoButton>
              ) : null}
              {title ? <Title>{removeMarkTags(title)}</Title> : null}
            </TitleGroup>
          )}
        </PageInfo>
        {isDetailPage && !isEvidencePage && title !== "" && (
          <IconSection>
            <PlayerToggleButton type="button" onClick={togglePlayerVisible}>
              <PlayerToggleHighlight $visible={showPlayerOnboarding} />
              {player ? <YoutubeOnIcon /> : <YoutubeOffIcon />}
              {showPlayerOnboarding ? (
                <PlayerOnboarding>
                  <PlayerOnboardingTitle>
                    영상 플레이어 숨기기/켜기
                  </PlayerOnboardingTitle>
                  <PlayerOnboardingBody>
                    헤더의 버튼으로 유튜브 플레이어를 언제든 열고 닫을 수
                    있어요.
                  </PlayerOnboardingBody>
                  <PlayerOnboardingActions>
                    <PlayerOnboardingPrimary
                      type="button"
                      onClick={handlePlayerOnboardingGotIt}
                    >
                      알겠어요
                    </PlayerOnboardingPrimary>
                    <PlayerOnboardingSecondary
                      type="button"
                      onClick={handlePlayerOnboardingLater}
                    >
                      나중에 보기
                    </PlayerOnboardingSecondary>
                  </PlayerOnboardingActions>
                </PlayerOnboarding>
              ) : null}
            </PlayerToggleButton>
            <ShareIcon onClick={copyUrlToClipboard} />
          </IconSection>
        )}
        {canShowMenuSection && !user.email ? (
          <>
            <MenuIcon onClick={handleMenuClick}></MenuIcon>
            {menuOpen ? (
              <Dropdown>
                {VISIBLE_MENU_ITEMS.map((item) => (
                  <DropdownItem
                    key={item.href}
                    onClick={() =>
                      handleMenuNavigation(item.href, item.loadingMsg)
                    }
                  >
                    <span className="icon">{item.icon}</span>
                    <span className="label">{item.label}</span>
                  </DropdownItem>
                ))}

                {/* 로그인/로그아웃 */}
                <DropdownItem onClick={() => handleAuth(!!user.email)}>
                  {user.email ? "로그아웃" : "로그인하기"}
                </DropdownItem>
              </Dropdown>
            ) : null}
          </>
        ) : null}
        {loadingPage ? (
          <LoadingOverlay>
            <LoadingSpinner />
            <LoadingText>{loadingText}</LoadingText>
          </LoadingOverlay>
        ) : null}
        {user.email ? (
          <ProfileWrapper>
            <ProfileImage
              onClick={() => {
                logCtaClick(
                  "menu_open",
                  user?.id ?? null,
                  user?.email ?? null,
                  getOrCreateAnonId()
                );
                handleClickProfile();
              }}
            >
              {user.picture ? (
                <img src={user.picture} alt="User profile" />
              ) : (
                <ProfileInitial aria-hidden>
                  {(user.name || user.email || "").charAt(0).toUpperCase()}
                </ProfileInitial>
              )}
            </ProfileImage>
            {menuOpen ? (
              <ProfileDropdown>
                <ProfileEmailRow>
                  <span aria-hidden>📬</span>
                  <ProfileEmailText>{user.email}</ProfileEmailText>
                </ProfileEmailRow>
                <ProfileEmailDescription>
                  이 주소로 브리핑이 저장되고 있습니다
                </ProfileEmailDescription>
                <ProfileDivider />
                <ProfileActionList>
                  <ProfileActionButton type="button" onClick={() => void handleArchiveShortcut()}>
                    내 브리핑 아카이브
                  </ProfileActionButton>
                  <ProfileActionButton type="button" onClick={handleLogoutShortcut}>
                    이 기기에서 로그아웃
                  </ProfileActionButton>
                </ProfileActionList>
                {VISIBLE_MENU_ITEMS.length ? (
                  <>
                    <ProfileDivider />
                    <ProfileMenuList>
                      {VISIBLE_MENU_ITEMS.map((item) => (
                        <ProfileMenuButton
                          key={item.href}
                          type="button"
                          onClick={() => handleProfileMenuNavigation(item)}
                        >
                          <span className="icon">{item.icon}</span>
                          <span className="label">{item.label}</span>
                        </ProfileMenuButton>
                      ))}
                    </ProfileMenuList>
                  </>
                ) : null}
              </ProfileDropdown>
            ) : null}
          </ProfileWrapper>
        ) : null}
      </Container>
      <Toast message="링크가 복사되었습니다" visible={toastVisible} />
      {archiveNoticeOpen ? (
        <ArchiveOverlay role="dialog" aria-modal="true">
          <ArchiveCard>
            <ArchiveTitle>아직 준비 중이에요</ArchiveTitle>
            <ArchiveMessage>
              내 브리핑 아카이브 기능을 준비하고 있어요. 곧 안내드릴게요.
            </ArchiveMessage>
            <ArchiveActions>
              <ArchiveButton type="button" onClick={() => setArchiveNoticeOpen(false)}>
                알겠어요
              </ArchiveButton>
            </ArchiveActions>
          </ArchiveCard>
        </ArchiveOverlay>
      ) : null}
    </>
  );
};

export default LogoHeader;

const Container = styled.header<{
  $isDetailPage: boolean;
  $isDesktop: boolean;
  $isUnsubscribeOrModifyPage: boolean;
}>`
  width: 100%;
  max-width: none;
  height: 52px;
  padding: 0 16px !important;
  position: fixed;
  top: 0;

  // 로그를 확인하기 위해 콘솔 출력
  color: ${({ $isUnsubscribeOrModifyPage, $isDetailPage }) => {
    return $isUnsubscribeOrModifyPage || $isDetailPage ? "black" : "white";
  }};

  background-color: ${({ $isUnsubscribeOrModifyPage, $isDetailPage }) =>
    $isUnsubscribeOrModifyPage
      ? "rgba(244, 244, 244, 1)"
      : $isDetailPage
      ? "rgba(244, 244, 244, 1)"
      : "rgb(0, 123, 255)"};

  color: ${({ $isUnsubscribeOrModifyPage, $isDetailPage }) =>
    $isUnsubscribeOrModifyPage || $isDetailPage ? "black" : "white"};

  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  overflow: visible;

  .logo {
    color: ${({ $isUnsubscribeOrModifyPage, $isDetailPage }) =>
      $isUnsubscribeOrModifyPage || $isDetailPage ? "black" : "white"};
    font-weight: 700;
    font-size: 20px;
    font-family: "Pretendard Variable";
  }

  @media screen and (min-width: 430px) {
    max-width: 430px;
  }
`;

const PageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Title = styled.span`
  font-size: 18px;
  font-weight: 600;
  line-height: 19.09px;
  width: 200px;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 12px;
`;

const LogoButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  font-weight: 700;
  font-size: 18px;
  font-family: "Pretendard Variable", sans-serif;
  cursor: pointer;
  color: inherit;
`;

const ProfileImage = styled.div`
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.12);
  color: #0f172a;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
  }
`;

const ProfileInitial = styled.span`
  font-size: 14px;
`;

const ProfileWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const IconSection = styled.div`
  display: flex;
  gap: 12px !important;
  align-items: center;
`;

const togglePulse = keyframes`
  0% {
    transform: scale(0.9);
    opacity: 0.8;
  }
  60% {
    transform: scale(1.2);
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
`;

const PlayerToggleButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
`;

const PlayerToggleHighlight = styled.span<{ $visible: boolean }>`
  position: absolute;
  inset: -6px;
  border-radius: 999px;
  border: 2px solid #2563eb;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: none;
  transition: opacity 0.2s ease;
  animation: ${({ $visible }) =>
    $visible
      ? css`
          ${togglePulse} 1.6s ease-in-out infinite;
        `
      : "none"};
`;

const PlayerOnboarding = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: -12px;
  width: 240px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
  z-index: 12000;
  text-align: left;

  &::before {
    content: "";
    position: absolute;
    top: -10px;
    right: 24px;
    border-width: 0 8px 10px 8px;
    border-style: solid;
    border-color: transparent transparent #ffffff transparent;
  }

  @media (max-width: 600px) {
    right: auto;
    left: -260%;
    transform: translateX(-50%);
    width: min(90vw, 280px);
  }
`;

const PlayerOnboardingTitle = styled.strong`
  display: block;
  font-size: 14px;
  color: #0f172a;
  margin-bottom: 6px;
`;

const PlayerOnboardingBody = styled.p`
  margin: 0 0 12px;
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
`;

const PlayerOnboardingActions = styled.div`
  display: flex;
  gap: 6px;
`;

const PlayerOnboardingPrimary = styled.button`
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
`;

const PlayerOnboardingSecondary = styled.button`
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
`;

const LogoutBtn = styled.div`
  width: 100%;
  padding: 20px;
  background: #ffffff;

  font-family: var(--font-Pretendard);
  font-size: 16px;
  font-weight: 700;
  line-height: 120%;
  border-bottom: 1px solid black;
  position: absolute;
  bottom: -180px;
  right: 0px;
`;

const MenuDropdown = styled.div`
  display: flex;
  flex-direction: column;
  font-family: var(--font-Pretendard);

  div:nth-child(1) {
    bottom: -60px;
  }
  div:nth-child(2) {
    bottom: -120px;
  }
  div:nth-child(3) {
    bottom: -180px;
  }
  div:nth-child(4) {
    bottom: -240px;
  }
  div:nth-child(5) {
    bottom: -300px;
  }
`;

const MenuItem = styled.div`
  width: 100%;
  padding: 20px;
  background: #ffffff;
  font-size: 16px;
  font-weight: 700;
  line-height: 120%;
  border-bottom: 1px solid black;
  position: absolute;
  right: 0px;
  color: black;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 5px solid white;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: white;
  margin-top: 10px;
  font-size: 16px;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 52px;
  right: 0;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const DropdownItem = styled.div`
  padding: 20px 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  &:hover {
    background: #f0f0f0;
  }
  .icon {
    font-size: 16px;
  }
`;

const ArchiveOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const ArchiveCard = styled.div`
  width: min(90%, 320px);
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.25);
`;

const ArchiveTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
`;

const ArchiveMessage = styled.p`
  margin: 12px 0 20px;
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
`;

const ArchiveActions = styled.div`
  display: flex;
  justify-content: center;
`;

const ArchiveButton = styled.button`
  padding: 10px 18px;
  border-radius: 12px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-weight: 650;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const ProfileDropdown = styled.div`
  position: absolute;
  top: 48px;
  right: 0;
  width: 280px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1001;
`;

const ProfileEmailRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 700;
  color: #0f172a;
`;

const ProfileEmailText = styled.span`
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProfileEmailDescription = styled.p`
  font-size: 13px;
  color: #475569;
  margin: 0;
`;

const ProfileDivider = styled.div`
  height: 1px;
  background: #e2e8f0;
`;

const ProfileActionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProfileActionButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  background: #f1f5f9;
  color: #0f172a;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;

  &:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ProfileMenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProfileMenuButton = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  font-size: 14px;
  color: #1e293b;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(148, 163, 184, 0.2);
  }

  .icon {
    font-size: 16px;
  }

  .label {
    flex: 1;
    text-align: left;
  }
`;
