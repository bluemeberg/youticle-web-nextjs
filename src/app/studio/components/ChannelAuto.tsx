// app/components/ChannelAutoArticleSection.tsx

"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useRecoilValue } from "recoil";
import { userState } from "@/store/user";

const ChannelAutoArticleSection: React.FC = () => {
  const user = useRecoilValue(userState);
  const [channelUrl, setChannelUrl] = useState<string>("");
  const [registeredChannel, setRegisteredChannel] = useState<string | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = () => {
    if (!user.email) {
      setErrorMessage("로그인이 필요한 기능입니다.");
      return;
    }
    if (!channelUrl) {
      setErrorMessage("채널 주소 또는 핸들명을 입력해주세요.");
      return;
    }
    // 예: 실제 API 호출 -> 성공 시 setRegisteredChannel
    setRegisteredChannel(channelUrl);
    setChannelUrl("");
    setErrorMessage("");
    setSuccessMessage(
      "채널이 등록되었습니다! 매일 오전 7시에 새 영상이 이메일로 전송됩니다."
    );
  };

  const handleUnregister = () => {
    // API로 채널 해제
    setRegisteredChannel(null);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleChange = () => {
    // 채널 변경 로직
    setRegisteredChannel(null);
    setSuccessMessage("");
    setErrorMessage("");
  };

  return (
    <Container>
      <SectionTitle>채널 자동 아티클</SectionTitle>
      <Description>
        매일 오전 7시에 등록하신 채널 새 영상을 아티클로 만들어 이메일로
        보내드립니다.
      </Description>

      {!registeredChannel ? (
        <>
          <InputBox>
            <Input
              placeholder="채널 URL 또는 @핸들명"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
            />
            <Button onClick={handleRegister}>등록하기</Button>
          </InputBox>
          <GuideText>
            예:
            <ExampleCode>https://www.youtube.com/@YahooFinance</ExampleCode>
            <br />
            채널 주소는 <strong>유튜브 채널 페이지</strong>에 들어가면 브라우저
            주소창에서 복사할 수 있어요.
            <br />
            또는 채널 이름 아래 보이는 <strong>@핸들</strong>을 그대로
            입력하셔도 됩니다.
          </GuideText>
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </>
      ) : (
        <RegisteredBox>
          <p>
            등록된 채널: <strong>{registeredChannel}</strong>
          </p>
          <p>매일 오전 7시에 새 영상이 자동 아티클로 전송됩니다.</p>
          <ButtonRow>
            <SmallButton onClick={handleChange}>채널 변경하기</SmallButton>
            <SmallButton onClick={handleUnregister}>해제하기</SmallButton>
          </ButtonRow>
        </RegisteredBox>
      )}

      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
    </Container>
  );
};

export default ChannelAutoArticleSection;

/* ============ Styled ============ */
const Container = styled.div`
  margin-top: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
`;

const InputBox = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const GuideText = styled.div`
  font-size: 13px;
  color: #555;
  margin-top: 4px;
  line-height: 1.4;
  strong {
    font-weight: 600;
  }
`;

const ExampleCode = styled.span`
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 4px;
  margin: 2px 0;
  font-size: 13px;
  color: #333;
  border-radius: 4px;
`;

const ErrorMessage = styled.div`
  font-size: 14px;
  color: #ff3b3b;
  margin-top: 8px;
`;

const RegisteredBox = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  padding: 12px;
  border-radius: 4px;
  p {
    font-size: 14px;
    margin: 4px 0;
  }
  strong {
    font-weight: 700;
    color: #000;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const SmallButton = styled.button`
  background-color: #666;
  color: #fff;
  font-size: 12px;
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const SuccessMessage = styled.div`
  font-size: 14px;
  color: #007bff;
  margin-top: 8px;
`;
