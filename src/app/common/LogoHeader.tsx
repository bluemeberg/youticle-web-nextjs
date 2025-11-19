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
}

const LogoHeader = ({
  title = "",
  onBack,
  onBackHome,
  showLogo = false,
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
    isDetailPage || isEvidencePage || isUnsubscribeOrModifyPage;

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
      // const { user } = await signInWithPopup(auth, provider);
      const result = await signInWithPopup(auth, provider);
      // [4] Firebase가 발급한 credential에서 accessToken 추출
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const accessToken = credential?.accessToken;
      // console.log(accessToken);
      const data = await getUserByEmail(
        result.user.email,
        result.user.displayName
      );
      setUser({
        name: result.user.displayName,
        email: result.user.email,
        picture: result.user.photoURL,
        id: data.id,
      });
    } catch (e) {
      console.error(e);
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
      setMenuOpen((prev) => !prev);
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
    if (pathname === url) return router.push(url);

    setLoadingText(loadingMessage || "로딩 중..."); // 로딩 메시지 설정
    setLoadingPage(true); // 로딩 상태 활성화
    setTimeout(() => {
      router.push(url);
      // setLoadingPage(false); // 페이지 이동 후 로딩 상태 해제
    }, 500); // UI 자연스럽게 변경을 위해 0.8초 딜레이
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
        {shouldRenderDefaultLogoSlot && (
          <>
            {!pathname.includes("/detail") &&
              !pathname.startsWith("/editor/") &&
              !pathname.startsWith("/studio/") &&
              user.picture === "" && (
                <MenuIcon onClick={handleMenuClick}></MenuIcon>
              )}
            {/* 드롭다운 */}
            {menuOpen && (
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
            )}
            {/* 로딩 중일 때 화면 중앙에 표시되는 안내 메시지 */}
            {loadingPage && (
              <LoadingOverlay>
                <LoadingSpinner />
                <LoadingText>{loadingText}</LoadingText>
              </LoadingOverlay>
            )}
            {user.picture !== "" && (
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
                <img src={user.picture} alt="User profile" />
              </ProfileImage>
            )}
          </>
        )}
      </Container>
      <Toast message="링크가 복사되었습니다" visible={toastVisible} />
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

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
  }
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
