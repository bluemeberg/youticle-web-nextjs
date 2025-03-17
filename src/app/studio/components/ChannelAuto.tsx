"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import ChannelFeedSection from "./ChannelFeedSection";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import { useRouter } from "next/navigation";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { getUserByEmail } from "@/api/apiClient";
import { parseSubscribersCount, timeAgo } from "@/utils/formatter";
import { channelFeedRefreshTrigger } from "@/store/userChannelFeedStatus";

// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

// 채널 정보 인터페이스
interface ChannelData {
  id: string;
  user_id: number;
  user_name: string;
  channel_handle: string;
  title: string;
  description: string;
  overview: string;
  thumbnail: string; // 채널 썸네일
  banner: string; // 채널 배너
  sub_count: number;
  view_count: number;
  video_count: number;
  created_at: string;
}

interface VideoData {
  video_id: string;
  title: string;
  section: string;
  upload_date: string;
  duration: string;
  thumbnail: string;
  views: number;
  [key: string]: any; // 기타 필드
}

interface User {
  email: string;
  displayName: string;
  photoURL: string;
}

export default function ChannelAutoArticleSection() {
  const router = useRouter();
  const user = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);
  const setFeedRefresh = useSetRecoilState(channelFeedRefreshTrigger);

  // 입력값, 등록된 채널
  const [channelInput, setChannelInput] = useState("");
  const [registeredChannel, setRegisteredChannel] =
    useState<ChannelData | null>(null);

  // 로딩, 에러, 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingMessage2, setLoadingMessage2] = useState("");

  // 채널 수정 중인지 상태
  const [isEditing, setIsEditing] = useState(false);
  // 오늘 생성된 아티클
  const [todayArticles, setTodayArticles] = useState<VideoData[]>([]);

  // 1) 로그인 후 채널 등록(모달 로직)
  const handleRegister = () => {
    if (!user.email) {
      // 로그인 안된 경우 모달 표시
      setShowLoginModal(true);
      return;
    }
    handleRegisterAfterLogin(); // 로그인 상태이면 즉시 등록
  };

  // 2) 실제 등록 함수
  const handleRegisterAfterLogin = async () => {
    if (!channelInput.trim()) {
      setErrorMessage("채널 핸들이나 URL을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 최대 5분

    setIsLoading(true);
    setLoadingMessage(
      "✨ 지금은 최초 등록이므로 최신 영상의 아티클을 즉시 생성 중이에요."
    );
    setLoadingMessage2(
      "※ 다음부터는 매일 아침 7시에 자동으로 새 영상을 감지하여 아티클로 만들어드려요."
    );

    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/process/channel/${encodeURIComponent(
          channelInput
        )}?user_id=${user.id}`,
        {
          method: "GET",
          headers: { accept: "application/json" },
          signal: controller.signal,
        }
      );
      if (!response.ok) {
        if (response.status === 400) {
          const errData = await response.json();
          setErrorMessage(errData.detail);
          setShowErrorModal(true);
        } else {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        return;
      }
      const { task_id, video_id } = await response.json();
      router.push(
        `/studio/channel/${channelInput}/${video_id}?task_id=${task_id}`
      );
    } catch (err) {
      console.error("등록 오류:", err);
      setErrorMessage("채널 등록 중 문제가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
      clearTimeout(timeoutId);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  };

  // 3) 채널 변경
  const handleUpdateChannel = async () => {
    if (!channelInput.trim() || !registeredChannel) {
      setErrorMessage("변경할 채널 핸들을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);
    setLoadingMessage("채널 정보를 업데이트 중...");
    setLoadingMessage2("다음날 오전 7시부터 신규 채널을 모니터링합니다!");

    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/update/${
          user.id
        }?old_handle=${encodeURIComponent(
          registeredChannel.channel_handle
        )}&new_handle=${encodeURIComponent(channelInput)}`,
        {
          method: "PUT",
          headers: { accept: "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("채널 변경 실패");
      }

      // 채널 정보 다시 가져오기
      await fetchRegisteredChannel();
      // 오늘 아티클 새로 불러오기
      await fetchTodayArticles(user.id);
      // 피드 갱신
      setFeedRefresh((prev) => prev + 1);
      // UI 업데이트
      setIsEditing(false);
      setChannelInput("");
    } catch (err) {
      console.error("채널 변경 오류:", err);
      setErrorMessage("채널 변경 중 오류가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingMessage2("");
    }
  };

  // 3-1) 변경 취소
  const handleCancelChange = () => {
    setIsEditing(false);
    setChannelInput("");
  };

  // 로그인 성공
  const handleLoginSuccess = async (loginUser: {
    email: string;
    displayName: string;
    photoURL: string;
  }) => {
    setShowLoginModal(false);
    try {
      const data = await getUserByEmail(loginUser.email, loginUser.displayName);
      setUserState({
        name: loginUser.displayName,
        email: loginUser.email,
        picture: loginUser.photoURL,
        id: data.id,
      });

      // ✅ 채널 존재 여부 확인
      const res = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${data.id}`
      );
      const json = await res.json();
      const existingChannel = json[0];

      if (existingChannel) {
        // 이미 등록된 채널이 있다면 등록 불가 안내
        setRegisteredChannel(existingChannel); // 기존 채널 UI에 표시
        setErrorMessage(
          `이미 등록된 채널이 있습니다: "${existingChannel.title}".\n채널 변경 을 원하시면 "채널 변경하기" 기능을 이용해주세요.`
        );
        setShowErrorModal(true);
        return;
      }

      if (!channelInput.trim()) {
        setErrorMessage("채널 핸들이나 URL을 입력해주세요.");
        setShowErrorModal(true);
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 최대 5분

      setIsLoading(true);
      setLoadingMessage(
        "✨ 지금은 최초 등록이므로 최신 영상의 아티클을 즉시 생성 중이에요."
      );
      setLoadingMessage2(
        "※ 다음부터는 매일 아침 7시에 자동으로 새 영상을 감지하여 아티클로 만들어드려요."
      );

      try {
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/editor/process/channel/${encodeURIComponent(
            channelInput
          )}?user_id=${data.id}`,
          {
            method: "GET",
            headers: { accept: "application/json" },
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          if (response.status === 400) {
            const errData = await response.json();
            setErrorMessage(errData.detail);
            setShowErrorModal(true);
          } else {
            throw new Error(`HTTP 오류: ${response.status}`);
          }
          return;
        }
        const { task_id, video_id } = await response.json();
        router.push(
          `/studio/channel/${channelInput}/${video_id}?task_id=${task_id}`
        );
      } catch (err) {
        console.error("등록 오류:", err);
        setErrorMessage("채널 등록 중 문제가 발생했습니다.");
        setShowErrorModal(true);
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
        setLoadingMessage("");
        setLoadingMessage2("");
      }
    } catch (err) {
      console.error("로그인 후 사용자 정보 업데이트 실패:", err);
    }
  };

  // 오늘 아티클 가져오기
  const fetchTodayArticles = async (userId: number) => {
    try {
      const res = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/archive/today/${userId}`
      );
      if (!res.ok) throw new Error("아티클 조회 실패");
      const json = await res.json();
      setTodayArticles(json.today_articles || []);
    } catch (err) {
      console.error("오늘 아티클 조회 실패:", err);
    }
  };

  // 등록된 채널 정보
  const fetchRegisteredChannel = async () => {
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/editor/user_channels/by_user/${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setRegisteredChannel(data[0] || null);
      }
    } catch (err) {
      console.error("채널 조회 실패:", err);
    }
  };

  useEffect(() => {
    if (!user.id) {
      // 로그아웃 또는 user 상태 초기화되면 등록 채널 정보도 초기화
      setRegisteredChannel(null);
      setTodayArticles([]);
      return;
    }

    // 로그인 상태라면 데이터 가져오기
    fetchRegisteredChannel();
    fetchTodayArticles(user.id);
  }, [user.id]);

  // Overview가 없으면 description 160자만 표시
  const truncateOrOverview = () => {
    if (!registeredChannel) return "";
    if (registeredChannel.overview) return registeredChannel.overview;
    const desc = registeredChannel.description || "";
    if (desc.length <= 160) return desc;
    return desc.slice(0, 160) + "...";
  };
  // 1. 상태 추가
  const [showHintImages, setShowHintImages] = useState(false);

  // 2. 토글 핸들러 함수 추가
  const toggleHintImages = () => setShowHintImages((prev) => !prev);
  // UI
  return (
    <SectionWrapper>
      <GuideText>
        매일 오전 7시에 등록하신 유튜브 채널의 새 영상을 아티클 형태로
        받아보세요!
      </GuideText>

      {/* 채널 등록 여부에 따라 UI 분기 */}
      {registeredChannel ? (
        <RegisteredContainer>
          {registeredChannel.banner && (
            <BannerArea bannerUrl={registeredChannel.banner}>
              <BannerOverlay />
            </BannerArea>
          )}

          <CardWrapper>
            <ChannelRow>
              <ThumbWrapper>
                <ChannelThumb
                  src={registeredChannel.thumbnail}
                  alt={registeredChannel.title}
                />
              </ThumbWrapper>
              <ChannelInfo>
                <ChannelTitle>{registeredChannel.title}</ChannelTitle>
                <ChannelHandle>
                  {registeredChannel.channel_handle}
                </ChannelHandle>
                <SubCount>
                  {parseSubscribersCount(registeredChannel.sub_count)} 구독
                </SubCount>
              </ChannelInfo>
            </ChannelRow>

            <ChannelDesc>{truncateOrOverview()}</ChannelDesc>

            {/* 오늘의 아티클 */}
            <TodayArticleSection>
              <TodaySectionTitle>📌 오늘 생성된 아티클</TodaySectionTitle>
              {todayArticles.length === 0 ? (
                <EmptyToday>
                  {/* <EmptyIcon>📡</EmptyIcon> */}
                  <EmptyMsg>
                    오늘 생성된 아티클이 없습니다. <br />
                    내일 오전 7시에 다시 확인해주세요!
                  </EmptyMsg>
                </EmptyToday>
              ) : (
                todayArticles.map((art) => (
                  <ArticleCard
                    key={art.video_id}
                    onClick={() =>
                      router.push(
                        `/studio/channel/${registeredChannel.channel_handle}/${art.video_id}`
                      )
                    }
                  >
                    <ArticleInfo>
                      <ArticleTitle>
                        {art.summary_data.headline_title}
                      </ArticleTitle>
                      <ArticleMeta>
                        조회수 {art.views?.toLocaleString()}회 ·{" "}
                        {timeAgo(art.upload_date)}
                      </ArticleMeta>
                    </ArticleInfo>
                    <ArticleThumb src={art.thumbnail} alt={art.title} />
                  </ArticleCard>
                ))
              )}
            </TodayArticleSection>

            {/* 변경 버튼 or 수정 폼 */}
            {!isEditing ? (
              <ButtonRow>
                <ChangeButton onClick={() => setIsEditing(true)}>
                  채널 변경하기
                </ChangeButton>
              </ButtonRow>
            ) : (
              <EditSection>
                <EditLabel>채널 변경</EditLabel>
                <NoticeMessage>
                  <strong>채널을 변경</strong>하면 내일 오전 7시에 새 채널이
                  모니터링됩니다
                </NoticeMessage>
                <InputRow>
                  <UrlInput
                    placeholder="@NewChannelHandle"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                  />
                </InputRow>
                <EditGuide>채널 핸들 or URL을 입력해주세요.</EditGuide>
                <ButtonRow>
                  <ApplyButton onClick={handleUpdateChannel}>
                    변경 적용
                  </ApplyButton>
                  <CancelButton onClick={handleCancelChange}>
                    변경 취소
                  </CancelButton>
                </ButtonRow>
              </EditSection>
            )}
          </CardWrapper>
        </RegisteredContainer>
      ) : (
        <RegisterCard>
          <ChannelInputWrapper>
            <ChannelInput
              placeholder="@YahooFinance"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
            />
          </ChannelInputWrapper>
          {/* <RegisterGuide>채널명 혹은 @핸들명을 입력하세요.</RegisterGuide> */}
          {/* ▼ 핸들을 찾는 방법 안내 박스 */}
          <HintBox>
            <HintTitle>유튜브에서 @채널핸들명을 어디서 찾나요?</HintTitle>
            <HintDesc>
              채널 홈 화면 상단에서 <strong>@아이디(핸들)</strong>을 확인할 수
              있어요.
              <br />
              아래 가이드 이미지처럼, 채널 이름 아래쪽에 보이는 <em>
                @...
              </em>{" "}
              문구가 바로 핸들명입니다.
            </HintDesc>
            {/* 여기에 펼치기 토글 버튼 + 가로 스크롤 영역 추가 */}
            <ToggleHintButton onClick={toggleHintImages}>
              {showHintImages ? "접기 ▲" : "가이드 이미지 보기 ▼"}
            </ToggleHintButton>
            {showHintImages && (
              <HintImageScrollContainer>
                <HintImage src="/images/YoutubeHandleGuide1.png" alt="예시1" />
                <HintImage src="/images/YoutubeHandleGuide2.png" alt="예시2" />
              </HintImageScrollContainer>
            )}
          </HintBox>
          <ButtonRow>
            <RegisterButton onClick={handleRegister}>
              채널 등록하기
            </RegisterButton>
          </ButtonRow>
        </RegisterCard>
      )}

      {/* 채널 이력 피드 */}
      <ChannelFeedSection />

      {/* 로딩/에러 모달 */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingBox>
            <Spinner />
            <LoadingMessage>{loadingMessage}</LoadingMessage>
            <SubMessage>{loadingMessage2}</SubMessage>
          </LoadingBox>
        </LoadingOverlay>
      )}

      {showErrorModal && (
        <ModalOverlay>
          <ErrorModal>
            <ErrorTitle>⚠️ 안내</ErrorTitle>
            <ErrorMessageText>{errorMessage}</ErrorMessageText>
            <ErrorCloseButton onClick={() => setShowErrorModal(false)}>
              닫기
            </ErrorCloseButton>
          </ErrorModal>
        </ModalOverlay>
      )}

      {showLoginModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalClose onClick={() => setShowLoginModal(false)}>×</ModalClose>
            <InfoMessage>로그인이 필요합니다</InfoMessage>
            <InfoDescription>
              채널 등록 전 Google 로그인 해주세요.
            </InfoDescription>
            <GoogleLogin onLoginSuccess={handleLoginSuccess} />
          </ModalContent>
        </ModalOverlay>
      )}
    </SectionWrapper>
  );
}

/* ======== Styled ======== */

const fadeIn = keyframes`
  from { opacity:0; transform: translateY(10px); }
  to { opacity:1; transform: translateY(0); }
`;

const SectionWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const GuideText = styled.p`
  font-size: 16px;
  color: #222;
  line-height: 1.4;
  margin: 12px 16px;
  font-weight: 600;
  margin-top: 32px;
`;

const HintBox = styled.div`
  background: #f8f9fa; /* 은은한 연회색 톤 */
  border: 1px solid #d8dee2; /* 더 부드러운 테두리 */
  border-radius: 8px;
  padding: 14px 18px;
  /* margin: 0 16px 16px; */
  margin-top: 12px;
`;

const HintTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #333;
`;

const HintDesc = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  margin-bottom: 10px;

  strong {
    color: #000;
  }

  em {
    font-style: italic;
    color: #777;
  }
`;

const ToggleHintButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: #007bff;
  background: none;
  border: none;
  margin-top: 6px;
  padding: 0;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const HintImageScrollContainer = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  margin-top: 10px;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
`;

const HintImage = styled.img`
  width: 70%;
  max-width: 260px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
`;
const RegisteredContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

interface BannerProps {
  bannerUrl: string;
}
const BannerArea = styled.div<BannerProps>`
  height: 160px;
  background: ${({ bannerUrl }) =>
    bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : "#ccc"};
  position: relative;
`;

const BannerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.25);
`;

const CardWrapper = styled.div`
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  padding: 16px;
  margin: -60px 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
`;

const ChannelRow = styled.div`
  display: flex;
  align-items: center;
`;

const ThumbWrapper = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 27px;
  overflow: hidden;
  margin-right: 12px;
`;
const ChannelThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ChannelInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const ChannelHandle = styled.span`
  font-size: 14px;
  color: #666;
`;

const SubCount = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
`;

const ChannelDesc = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
`;

const TodayArticleSection = styled.div`
  margin-top: 24px;
`;

const TodaySectionTitle = styled.h5`
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #222;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
`;

const EmptyToday = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #eee;
`;

const EmptyIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
`;

const EmptyMsg = styled.div`
  font-size: 14px;
  color: #666;
  text-align: center;
  line-height: 1.4;
`;

const ArticleCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fcfcfc;
  border: 1px solid #eaeaea;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f4f8ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
  }
`;

const ArticleInfo = styled.div`
  flex: 1;
`;
const ArticleTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #222;
  margin-bottom: 4px;
  line-height: 132%;
`;
const ArticleMeta = styled.div`
  font-size: 13px;
  color: #888;
  margin-top: 4px;
`;
const ArticleThumb = styled.img`
  width: 100px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
  margin-left: 12px;
  flex-shrink: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const ChangeButton = styled.button`
  flex: 1;
  background-color: #f0f0f5;
  color: #333;
  font-weight: 600;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #e4e4eb;
  }
`;

const EditSection = styled.div`
  margin-top: 16px;
  background-color: #fafafa;
  border: 1px dashed #ccc;
  border-radius: 6px;
  padding: 12px;
`;

const EditLabel = styled.div`
  background-color: #e0f2ff;
  color: #007bff;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  margin-bottom: 8px;
`;

const NoticeMessage = styled.div`
  background: #f7f7f7;
  font-size: 14px;
  color: #000;
  line-height: 1.3;
  font-weight: 600;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 12px;
`;

const InputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const EditGuide = styled.p`
  font-size: 12px;
  color: #616161;
  margin-top: 4px;
`;

const ApplyButton = styled.button`
  flex: 1;
  background-color: #007bff;
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;

  &:hover {
    background-color: #008ae0;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  background-color: #e0e0e0;
  color: #333;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;

  &:hover {
    background-color: #ccc;
  }
`;

const RegisterCard = styled.div`
  border-radius: 8px;
  /* padding: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); */
  margin: 0 16px;
`;

const ChannelInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelInput = styled.input`
  padding: 16px;
  font-size: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const RegisterGuide = styled.p`
  font-size: 12px;
  color: #616161;
  margin-top: 6px;
`;

const RegisterButton = styled.button`
  flex: 1;
  background-color: #007bff;
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 14px;
  margin-top: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

/** 로딩 & 에러 모달 */
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LoadingBox = styled.div`
  text-align: center;
  width: 80%;
`;
const LoadingMessage = styled.p`
  margin-top: 20px;
  font-size: 18px;
  font-weight: 700;
  color: #000;
  line-height: 132%;
  white-space: pre-line;
`;
const SubMessage = styled.p`
  margin-top: 12px;
  font-size: 14px;
  line-height: 132%;
  color: #000;
  text-align: center;
  white-space: pre-line;
`;

const Spinner = styled.div`
  margin: 0 auto 16px;
  width: 32px;
  height: 32px;
  border: 4px solid #ddd;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;

const ErrorModal = styled.div`
  background-color: #fff;
  padding: 20px 16px;
  border-radius: 6px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ErrorTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 12px;
`;

const ErrorMessageText = styled.p`
  font-size: 14px;
  color: #444;
  margin-bottom: 20px;
  line-height: 1.4;
`;

const ErrorCloseButton = styled.button`
  background-color: #000;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: #676767;
  }
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px 16px;
  border-radius: 4px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalClose = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
`;

const InfoMessage = styled.div`
  margin-top: 10px;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 12px;
  color: #333;
  line-height: 1.3;
`;

const InfoDescription = styled.p`
  font-weight: 400;
  margin-bottom: 20px;
  text-align: center;
  margin-top: 8px;
  line-height: 132%;
  color: #666;
`;

// // 4. 스타일 추가
// const ToggleHintButton = styled.button`
//   font-size: 13px;
//   font-weight: 600;
//   color: #007bff;
//   background: none;
//   border: none;
//   margin-top: 4px;
//   cursor: pointer;
// `;

// const HintImageScrollContainer = styled.div`
//   display: flex;
//   gap: 8px;
//   overflow-x: auto;
//   margin-top: 8px;

//   &::-webkit-scrollbar {
//     height: 6px;
//   }
//   &::-webkit-scrollbar-thumb {
//     background: #ccc;
//     border-radius: 3px;
//   }
// `;
