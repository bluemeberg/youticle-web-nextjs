"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useRouter, usePathname } from "next/navigation";
import { auth, signOut } from "@/firebase";
import { userState } from "@/store/user";
import { playerState } from "@/store/player";
import BackIcon from "@/assets/back.svg";
import YoutubeOffIcon from "@/assets/youtubeOff.svg";
import YoutubeOnIcon from "@/assets/youtubeOn.svg";
import MenuIcon from "@/assets/menu_icon.svg";
import ShareIcon from "@/assets/share.svg";
import Toast from "./Toast";
import { isDesktop } from "react-device-detect";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface LogoHeaderProps {
  title?: string;
}

const LogoHeader = ({ title = "" }: LogoHeaderProps) => {
  const user = useRecoilValue(userState);
  const setUser = useSetRecoilState(userState);
  const player = useRecoilValue(playerState);
  const setPlayer = useSetRecoilState(playerState);
  const [toastVisible, setToastVisible] = useState(false);
  const [logoutBtnVisible, setLogoutBtnVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClientDesktop, setIsClientDesktop] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isDetailPage =
    pathname.includes("/detail") ||
    pathname.startsWith("/editor/") ||
    pathname.startsWith("/samplePage") ||
    pathname.startsWith("/keyword/");

  const isUnsubscribeOrModifyPage =
    pathname.endsWith("/unsubscribe") || pathname.endsWith("/subject/modify");

  console.log(isUnsubscribeOrModifyPage);
  const previousPage = useRef<string | null>(null);

  useEffect(() => {
    // 페이지 최초 접근 시, 현재 경로 저장
    if (pathname.includes("/unsubscribe")) {
      previousPage.current = "/unsubscribe";
    }
  }, [pathname]);

  const handleBackClick = () => {
    if (
      pathname.includes("/detail") &&
      previousPage.current === "/unsubscribe"
    ) {
      router.push("/unsubscribe");
    }
    if (pathname.endsWith("/subject/modify")) {
      router.push("/today");
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

  const togglePlayerVisible = () => setPlayer(!player);

  const goToPage = (url: string) => router.push(url);

  const goHome = () => {
    if (pathname.startsWith("/editor/")) goToPage("/editor");
    else if (pathname.startsWith("/samplePage")) goToPage("/my");
    else if (pathname.startsWith("/keyword/")) goToPage("/my");
    else goToPage("/today");
  };

  const provider = new GoogleAuthProvider();

  const GoogleLogin = async () => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      setUser({
        name: user.displayName,
        email: user.email,
        picture: user.photoURL,
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

  const handleClickProfile = () => setMenuOpen((prev) => !prev);
  const handleMenuClick = () => setMenuOpen((prev) => !prev);

  useEffect(() => {
    setIsClientDesktop(isDesktop);
  }, []);

  return (
    <>
      <Container
        $isDetailPage={isDetailPage}
        $isDesktop={isClientDesktop}
        $isUnsubscribePage={isUnsubscribeOrModifyPage} // unsubscribe 페이지 스타일 적용
      >
        <PageInfo>
          {(pathname.endsWith("/unsubscribe") ||
            isDetailPage ||
            isUnsubscribeOrModifyPage) && (
            <BackIcon onClick={handleBackClick} />
          )}
          {title === "" ? (
            <span onClick={goHome} className="logo">
              YouTicle
            </span>
          ) : (
            <Title>{title}</Title>
          )}
        </PageInfo>
        {isDetailPage && title !== "" && (
          <IconSection>
            {player ? (
              <YoutubeOffIcon onClick={togglePlayerVisible} />
            ) : (
              <YoutubeOnIcon onClick={togglePlayerVisible} />
            )}
            <ShareIcon onClick={copyUrlToClipboard} />
          </IconSection>
        )}
        {title === "" && (
          <>
            {!pathname.includes("/detail") &&
              !pathname.startsWith("/editor/") &&
              user.picture === "" && (
                <MenuIcon onClick={handleMenuClick}></MenuIcon>
              )}
            {menuOpen && (
              <MenuDropdown>
                <MenuItem onClick={() => goToPage("/")}>홈</MenuItem>
                <MenuItem onClick={() => goToPage("/today")}>
                  오늘의 유튜브 아티클
                </MenuItem>
                {/* <MenuItem onClick={() => goToPage("/my")}>
                  나만의 아티클
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    window.open("https://tally.so/r/w4vWqk", "_blank")
                  }
                >
                  설문 참여하기
                </MenuItem> */}
                <MenuItem onClick={() => handleAuth(user.picture !== "")}>
                  {user.picture !== "" ? "로그아웃" : "로그인하기"}
                </MenuItem>
              </MenuDropdown>
            )}
            {user.picture !== "" && (
              <ProfileImage onClick={handleClickProfile}>
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
  padding: 0 20px !important;
  position: fixed;
  top: 0;

  // 로그를 확인하기 위해 콘솔 출력
  color: ${({ $isUnsubscribeOrModifyPage, $isDetailPage }) => {
    console.log("$isUnsubscribeOrModifyPage:", $isUnsubscribeOrModifyPage);
    console.log("$isDetailPage:", $isDetailPage);
    return $isUnsubscribeOrModifyPage || $isDetailPage ? "black" : "white";
  }};

  background-color: ${({ $isUnsubscribeOrModifyPage, $isDetailPage }) =>
    $isUnsubscribeOrModifyPage
      ? "rgba(244, 244, 244, 1)"
      : $isDetailPage
      ? "rgba(244, 244, 244, 1)"
      : "rgba(0, 123, 255, 1)"};

  color: ${({ $isUnsubscribeOrModifyPage, $isDetailPage }) =>
    $isUnsubscribeOrModifyPage || $isDetailPage ? "black" : "white"};

  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;

  .logo {
    color: ${({ $isUnsubscribeOrModifyPage, $isDetailPage }) =>
      $isUnsubscribeOrModifyPage || $isDetailPage ? "black" : "white"};
    font-weight: 700;
    font-size: 20px;
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

const Title = styled.span`
  font-size: 16px;
  font-weight: 400;
  line-height: 19.09px;
  width: 200px;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
