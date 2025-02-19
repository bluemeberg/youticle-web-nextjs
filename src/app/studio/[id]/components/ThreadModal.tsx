"use client";

import { url } from "inspector";
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

interface ThreadModalProps {
  videoId: string;
  onClose: () => void;
  section: string;
}

interface ThreadContent {
  content: string;
}

// const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

export default function ThreadModal({
  videoId,
  onClose,
  section,
}: ThreadModalProps) {
  const [threadTexts, setThreadTexts] = useState<ThreadContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const textareasRef = useRef<Array<HTMLTextAreaElement | null>>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false); // ✅ 업로드 성공 상태 추가

  // ✅ Threads 계정 URL 매핑 (업로드 후 이동 가능)
  const THREADS_ACCOUNT_URLS: { [key: string]: string } = {
    주식: "https://threads.com/@yousum.finance",
    부동산: "https://threads.com/@yousum.finance",
    가상자산: "https://threads.com/@yousum.finance",
    건강: "https://threads.com/@yousum.medical",
    "비즈니스/사업": "https://threads.com/@yousum_biz",
    "IT/테크": "https://threads.com/@yousum_tech",
    인공지능: "https://threads.com/@yousum_tech",
    "연애/결혼": "https://threads.com/@yousum_romantic",
    "뷰티/메이크업": "https://threads.com/@yousum_romantic",
    육아: "https://threads.com/@yousum.medical",
    정치: "https://threads.com/@youticle_politics",
  };

  const threadsUrl =
    THREADS_ACCOUNT_URLS[section] || "https://threads.com/default";
  console.log(THREADS_ACCOUNT_URLS[section]);
  // 🟢 (1) API 호출 - 기존 스레드 가져오기
  useEffect(() => {
    async function fetchThreadData() {
      try {
        const response = await fetch(
          `${NEXT_PUBLIC_API_BASE_URL}/threads/editor-pick/${videoId}`
        );
        const data = await response.json();

        if (data.draft_contents) {
          setThreadTexts(data.draft_contents);
        }
      } catch (error) {
        console.error("Error fetching thread data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchThreadData();
  }, [videoId]);

  // 🟢 (2) 데이터 로드 후, textarea 높이 자동 조정
  useEffect(() => {
    if (!isLoading) {
      textareasRef.current.forEach((textarea) => {
        if (textarea) {
          textarea.style.height = "auto";
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      });
    }
  }, [isLoading, threadTexts]); // 데이터가 변경될 때마다 실행

  // 🟢 (3) API 호출하여 수정된 데이터 저장
  async function updateThreadDraft(finalUpload: boolean = false) {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_API_BASE_URL}/threads/editor-pick/${videoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draft_contents: threadTexts,
            final_upload: finalUpload,
          }),
        }
      );

      const data = await response.json();
      console.log("Update response:", data);
      // ✅ 성공 상태로 전환
      setIsSuccess(true);
    } catch (error) {
      console.error("Error updating thread data:", error);
    } finally {
      setIsSaving(false);
    }
  }

  // 🟢 (4) 문단 변경 시 자동 저장
  const handleChange = (index: number, value: string) => {
    setThreadTexts((prev) => {
      const newArr = [...prev];
      newArr[index] = { content: value };
      return newArr;
    });

    // 높이 자동 조절
    const textarea = textareasRef.current[index];
    if (textarea) {
      textarea.style.height = "auto"; // 높이 초기화 후
      textarea.style.height = `${textarea.scrollHeight}px`; // scrollHeight 반영
    }

    // // 🟢 자동 저장 실행
    // updateThreadDraft();
  };

  // 🟢 (5) 문단 삭제 시 API 반영
  const handleRemove = (index: number) => {
    setThreadTexts((prev) => {
      const newArr = prev.filter((_, i) => i !== index);
      return newArr;
    });

    // // 삭제 후 자동 저장 실행
    // updateThreadDraft();
  };

  // 🟢 (6) 최종 저장 버튼 클릭 시 실행
  const handleSave = () => {
    console.log("최종 저장 데이터:", threadTexts);
    updateThreadDraft(true); // 최종 업로드 (`final_upload: true`)
    // onClose();
  };

  const shareToThreads = async (threadContent: string, url: string) => {
    try {
      const fullContent = `${threadContent}\n📌 참조\n${url}`;

      // ✅ 1. 클립보드에 텍스트 복사
      await navigator.clipboard.writeText(threadContent);
      console.log("스레드 내용이 클립보드에 복사되었습니다.");

      // ✅ 2. Safari 공유하기 API 실행
      if (navigator.share) {
        await navigator.share({
          title: "Threads에 게시하기",
          text: fullContent, // ✅ 공유할 텍스트
          url: "https://threads.net", // ✅ Threads 앱 실행 가능하도록 설정
        });

        console.log("공유 메뉴가 열렸습니다.");
      } else {
        alert("이 브라우저에서는 공유 기능이 지원되지 않습니다.");
      }
    } catch (error) {
      console.error("공유 오류:", error);
    }
  };
  // ✅ 사용 예시
  const threadContent = `스레드가 길어져서 아래 내용들은 하단 링크 참조해줘!
6. 🎪 인생의 역동성과 중요한 선택들
7. 💬 행복을 찾는 여정과 그 중요성
8. 🏆 경력의 중간 단계와 유산의 중요성
9. 🌊 인생의 파도와 변화의 수용
10. 🧭 인생의 방향성과 목표 설정`;

  const threadUrl = "https://www.youticle.io/studio/L75_uw9sZe8";
  return (
    <Overlay>
      <ModalBox>
        {/* ✅ 업로드 중이면 로딩 화면 표시 */}
        {isSaving ? (
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingMessage>업로드 중...</LoadingMessage>
          </LoadingContainer>
        ) : isSuccess ? (
          /* ✅ 업로드 성공 시 메시지 및 이동 버튼 표시 */
          <SuccessContainer>
            <SuccessMessage>✅ 업로드 성공하였습니다.</SuccessMessage>
            <CloseButton onClick={onClose} disabled={isSaving}>
              ✕
            </CloseButton>
            <GoToThreadsButton
              onClick={() => window.open(threadsUrl, "_blank")}
            >
              스레드 계정으로 이동하기
            </GoToThreadsButton>
          </SuccessContainer>
        ) : (
          <>
            <CloseButton onClick={onClose} disabled={isSaving}>
              ✕
            </CloseButton>
            <ModalTitle>스레드 생성하기</ModalTitle>
            {/* 🟡 로딩 상태 처리 */}
            {isLoading ? (
              <p>로딩 중...</p>
            ) : (
              <SectionList>
                <button
                  onClick={() => shareToThreads(threadContent, threadUrl)}
                >
                  📢 Threads에 공유하기
                </button>
                {threadTexts.map((item, idx) => (
                  <SectionItem key={idx}>
                    <HeaderRow>
                      <SectionLabel>스레드 {idx + 1}</SectionLabel>
                      <RemoveButton
                        onClick={() => handleRemove(idx)}
                        disabled={isSaving}
                      >
                        삭제
                      </RemoveButton>
                    </HeaderRow>

                    {/* 🟢 텍스트 수정 가능 */}
                    <SectionTextarea
                      ref={(el) => {
                        textareasRef.current[idx] = el;
                      }}
                      value={item.content}
                      onChange={(e) => handleChange(idx, e.target.value)}
                    />
                  </SectionItem>
                ))}

                {threadTexts.length === 0 && (
                  <EmptyMessage>모든 문단을 삭제했습니다.</EmptyMessage>
                )}
              </SectionList>
            )}

            <ButtonRow>
              <CancelButton onClick={onClose} disabled={isSaving}>
                취소
              </CancelButton>
              <SaveButton onClick={handleSave} disabled={isSaving}>
                {isSaving ? "업로드 중..." : "업로드"}
              </SaveButton>
            </ButtonRow>
          </>
        )}
      </ModalBox>
    </Overlay>
  );
}

/* --- styled components --- */
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  position: relative;
  width: 90%;
  max-width: 480px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
`;

const ModalTitle = styled.h2`
  margin: 0;
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
`;

const SectionList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
`;

const SectionItem = styled.div`
  margin-bottom: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 8px;
  background-color: #fafafa;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const SectionLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const RemoveButton = styled.button`
  background: transparent;
  color: #e00;
  border: none;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const SectionTextarea = styled.textarea`
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
  min-height: 60px;
  resize: none;
  overflow: hidden;
`;

const EmptyMessage = styled.div`
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-top: 16px;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const CancelButton = styled.button`
  padding: 8px 12px;
  background: #999;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const SaveButton = styled.button`
  padding: 8px 12px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

const LoadingMessage = styled.p`
  margin-top: 16px;
  font-size: 16px;
  font-weight: bold;
`;

const SuccessContainer = styled.div`
  text-align: center;
`;

const SuccessMessage = styled.p`
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 20px;
  margin-top: 12px;
`;

const GoToThreadsButton = styled.button`
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
`;
