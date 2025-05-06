"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";

const GOOGLE_CLIENT_ID =
  "303228054178-8tl7e7t4tup4s3d08olhgff2ap28vvl2.apps.googleusercontent.com";

/** ------------------------------------------------------------------
 *  ChannelFeedSection – 내 구독 채널 + 직접 입력 탭
 * ----------------------------------------------------------------*/
export default function ChannelFeedSection() {
  const router = useRouter();
  const user = useRecoilValue(userState);

  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"subs" | "manual">("subs");
  const [manualHandle, setManualHandle] = useState("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  // ① 에러 모달 상태 추가
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  /** ----------------- sessionStorage 에서만 로드 (정렬 포함) ----------------*/
  useEffect(() => {
    const saved = sessionStorage.getItem("mySubscriptions");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        arr.sort(
          (a: any, b: any) =>
            new Date(b.snippet.publishedAt).getTime() -
            new Date(a.snippet.publishedAt).getTime()
        );
        setSubs(arr);
      } catch {
        // ignore parsing errors
      }
    }
  }, []);
  // 검색 입력 처리
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  // 검색어 기반 필터링
  const filteredSubs = subs.filter((s: any) =>
    s.snippet.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  /** ----------------- 구독 채널 불러오기 (정렬 포함) ----------------*/
  const fetchSubs = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const js = await res.json();
      const items = js.items || [];
      // publishedAt 기준 내림차순 정렬
      items.sort(
        (a: any, b: any) =>
          new Date(b.snippet.publishedAt).getTime() -
          new Date(a.snippet.publishedAt).getTime()
      );
      setSubs(items);
      sessionStorage.setItem("mySubscriptions", JSON.stringify(items));
    } catch (e) {
      console.error(e);
      alert("구독 채널을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /** ----------------- 토큰 확인 & fetchSubs 호출 ----------------*/
  const refresh = () => {
    const tk = sessionStorage.getItem("myYoutubeToken");
    const exp = sessionStorage.getItem("myYoutubeTokenExpire");
    if (tk && exp && Date.now() < Number(exp)) {
      fetchSubs(tk);
    } else {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/youtube.readonly",
        callback: (r: any) => {
          const expire = Date.now() + (r.expires_in ?? 3600) * 1000;
          sessionStorage.setItem("myYoutubeToken", r.access_token);
          sessionStorage.setItem("myYoutubeTokenExpire", String(expire));
          fetchSubs(r.access_token);
        },
      });
      client.requestAccessToken();
    }
  };

  /** ----------------- 액션 ----------------*/
  const selectChannel = (id: string) => {
    router.push(`/studio/subscriptions/${id}`);
  };

  // ② handleManual 클릭 시 호출될 async 함수로 변경
  const submitManual = async () => {
    if (!manualHandle.trim()) {
      setErrorMessage("채널 핸들을 입력하세요.");
      setShowErrorModal(true);
      return;
    }
    try {
      const channelId = await resolveChannelId(manualHandle);
      router.push(`/studio/subscriptions/${channelId}`);
    } catch (err: any) {
      setErrorMessage("채널을 찾을 수 없습니다.");
      setShowErrorModal(true);
    }
  };

  // ③ 실제 YouTube API로 handle → channelId 변환
  async function resolveChannelId(handle: string): Promise<string> {
    const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;
    let h = handle.trim().replace(/^@/, "");

    // (A) legacy forUsername 조회
    const url1 = new URL("https://www.googleapis.com/youtube/v3/channels");
    url1.searchParams.set("part", "id");
    url1.searchParams.set("forHandle", h);
    url1.searchParams.set("key", key);
    let res = await fetch(url1.toString());
    let json = await res.json();
    if (json.items?.length) return json.items[0].id;
    return json.items[0].snippet.channelId;
  }

  /** ----------------- 렌더 ----------------*/
  const EmptyState = (
    <Empty>
      <EmptyIcon>📭</EmptyIcon>
      <p>
        구독 채널 정보를 다시 불러와야합니다.
        <br />
        <strong>&apos;새로고침&apos;</strong> 클릭 후 유튜브 구글 계정 다시
        연결해주세요.
      </p>
    </Empty>
  );

  /** ----------------- 렌더 ----------------*/
  return (
    <Container>
      <Header>
        <HeaderTitle>자동 요약 채널 변경하기</HeaderTitle>
        <RefreshButton onClick={refresh} disabled={loading}>
          {loading ? "불러오는 중…" : "새로고침"}
        </RefreshButton>
      </Header>

      <TabRow>
        <TabButton
          active={activeTab === "subs"}
          onClick={() => setActiveTab("subs")}
        >
          내 구독 채널
        </TabButton>
        <TabButton
          active={activeTab === "manual"}
          onClick={() => setActiveTab("manual")}
        >
          채널 ID 직접 입력
        </TabButton>
      </TabRow>

      {activeTab === "subs" ? (
        loading ? (
          <SkeletonContainer>
            {[1, 2, 3].map((k) => (
              <SkeletonCard key={k} />
            ))}
          </SkeletonContainer>
        ) : subs.length === 0 ? (
          EmptyState
        ) : (
          <>
            <SearchInput
              type="text"
              placeholder="채널 이름 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {filteredSubs.length > 0 ? (
              <List>
                {filteredSubs.map((s: any) => (
                  <Card
                    key={s.id}
                    onClick={() =>
                      selectChannel(s.snippet.resourceId.channelId)
                    }
                  >
                    <Thumb>
                      <Img
                        src={s.snippet.thumbnails.medium.url}
                        alt={s.snippet.title}
                      />
                    </Thumb>
                    <Info>
                      <Name>{s.snippet.title}</Name>
                      <Desc>{s.snippet.description}</Desc>
                    </Info>
                  </Card>
                ))}
              </List>
            ) : (
              <Message>검색 결과가 없습니다.</Message>
            )}
          </>
        )
      ) : (
        <>
          <ManualBox>
            <ManualInput
              placeholder="@ExampleChannel"
              value={manualHandle}
              onChange={(e) => setManualHandle(e.target.value)}
            />
            <ApplyButton onClick={submitManual}>변경 적용</ApplyButton>
          </ManualBox>
          <HintBox>
            <HintTitle>📌 유튜브 @채널ID 찾기</HintTitle>
            <HintDesc>
              채널 홈 화면 상단에서 <strong>@아이디</strong>를 확인할 수
              있습니다.
            </HintDesc>

            <HintImageScroll>
              <HintImg src="/images/YoutubeHandleGuide1.png" alt="guide1" />
              <HintImg src="/images/YoutubeHandleGuide2.png" alt="guide2" />
            </HintImageScroll>
          </HintBox>
        </>
      )}
      {/* ④ 에러 모달 */}
      {showErrorModal && (
        <ModalOverlay>
          <ModalContent>
            <InfoMessage>⚠️ 안내</InfoMessage>
            <InfoDescription>{errorMessage}</InfoDescription>
            <CloseButton onClick={() => setShowErrorModal(false)}>
              닫기
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

/** ------------------- Styled Components -------------------*/
const fade = keyframes`
  0% {opacity:.6}
  50% {opacity:1}
 100% {opacity:.6}
`;

const Container = styled.section`
  margin-top: 24px;
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  padding: 16px;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;
const HeaderTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
`;
const RefreshButton = styled.button`
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;
const SearchInput = styled.input`
  display: block;
  width: calc(100%);
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 20px;
`;
const TabRow = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 12px;
`;
const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 10px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: #fff;
  color: ${(p) => (p.active ? "#007bff" : "#555")};
  border-bottom: 2px solid ${(p) => (p.active ? "#007bff" : "transparent")};
`;
const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const Card = styled.li`
  display: flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    background: #f9fcff;
    transform: translateY(-2px);
  }
`;
const Thumb = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  overflow: hidden;
  margin-right: 12px;
`;
const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
const Info = styled.div`
  flex: 1;
`;
const Name = styled.h4`
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
`;
const Desc = styled.p`
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.3;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  display: -webkit-box;
  overflow: hidden;
`;
const ManualBox = styled.div`
  /* padding: 12px; */
  /* border: 1px dashed #ccc; */
  border-radius: 6px;
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 20px;
`;
const ManualInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;
const ApplyButton = styled.button`
  background: #007bff;
  color: #fff;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
`;
const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const SkeletonCard = styled.div`
  height: 70px;
  border-radius: 8px;
  background: linear-gradient(90deg, #eee 25%, #ddd 37%, #eee 63%);
  background-size: 400% 100%;
  animation: ${fade} 1.4s infinite ease;
`;
const Empty = styled.div`
  text-align: center;
  font-size: 14px;
  color: #666;
  padding: 40px 0;
`;
const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const HintBox = styled.div`
  background: #f8f9fa;
  border: 1px solid #d8dee2;
  border-radius: 8px;
  padding: 14px 18px;
`;
const HintTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
`;
const HintDesc = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  margin-bottom: 20px;
  strong {
    color: #000;
  }
`;
const ToggleHintButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: #007bff;
  background: none;
  border: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;
const HintImageScroll = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
`;
const HintImg = styled.img`
  width: 70%;
  max-width: 260px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
`;
const Message = styled.p`
  margin-top: 72px;
  text-align: center;
  color: #999;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalContent = styled.div`
  width: 90%;
  max-width: 360px;
  background: #fff;
  padding: 20px 16px;
  border-radius: 4px;
  text-align: center;
  position: relative;
`;
const ModalClose = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  border: none;
  background: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
`;
const InfoMessage = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
`;
const InfoDescription = styled.p`
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  white-space: pre-line;
`;
const CloseButton = styled.button`
  background: #000;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 8px 14px;
  cursor: pointer;
`;
