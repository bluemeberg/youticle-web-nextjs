"use client";

import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import { useState, useEffect, useId } from "react";
import Dropdown from "./components/Dropdown";
import Footer from "@/components/Footer";
import { useRecoilState, useRecoilValue } from "recoil";
import { keywordState } from "@/store/keyword";
import ServiceDescription from "./components/ServiceDescription";
import SampleArticle from "./components/SampleArticle";
import GoogleLogin from "@/common/MyArticleGoogleLogin";
import { userState } from "@/store/user";
import AlertPopup from "./components/AlertPopup";
import LoginPopup from "./components/LoginPopup";
import KeywordAlertPopup from "./components/KeywordAlertPopup";
import Information from "./components/Information";
const My = () => {
  const [currentTab, setCurrentTab] = useState("데일리");
  const [topic, setTopic] = useState("");
  const [directTopic, setDirectTopic] = useState("");
  const [keyword, setKeyword] = useRecoilState(keywordState);
  const [isPopupVisible, setIsPopupVisible] = useState(false); // 팝업 상태 관리
  const [alertPopupVisible, setAlertPopupVisible] = useState(false); // 경고 팝업 상태
  const [hasDailyKeyword, setHasDailyKeyword] = useState(false); // 새로운 컴포넌트 상태 관리
  const [hasWeeklyKeyword, setHasWeeklyKeyword] = useState(false); // 새로운 컴포넌트 상태 관리
  const [hasDailyAlertKeyword, setHasDailyAlertKeyword] = useState(false);
  const currentUser = useRecoilValue(userState); // userState 값을 읽음

  const handleChangeKeyword = (e: any, currentTab: string) => {
    if (currentTab === "데일리") {
      setKeyword({
        ...keyword,
        daily: e.target.value,
      });
    } else {
      setKeyword({
        ...keyword,
        weekly: e.target.value,
      });
    }
  };

  const handleChangeTopic = (option: string) => setTopic(option);

  const handleChangeDirectTopic = (e: any) => setDirectTopic(e.target.value);

  const handleTabClick = (tab: string) => setCurrentTab(tab);
  const handleServiceButtonClick = () => {
    if (
      (currentTab === "데일리" && !keyword.daily) ||
      (currentTab === "위클리" && !keyword.weekly) ||
      !topic ||
      (topic === "기타" && !directTopic)
    ) {
      setAlertPopupVisible(true); // 경고 팝업 보이기
    } else {
      setIsPopupVisible(true); // 팝업 보이기
    }
  };
  // Define a User interface for user-related data
  interface User {
    email: string;
    displayName: string;
  }
  // Define the structure of the Keyword object
  interface Keyword {
    user_id: number;
    keyword: string;
    category: string;
    period: string; // 'D' for Daily, 'W' for Weekly
  }
  const handleLoginSuccess = async (user: User) => {
    setIsPopupVisible(false); // 팝업 닫기
    await processing(user); // 로그인 후 키워드 추가
  };

  const processing = async (user: User) => {
    console.log("hello", user);
    if (user.email !== "") {
      const data = await createOrFetchUser(user.email, user.displayName);
      console.log("로그인 후 유저 정보", data);
      try {
        if (currentTab == "데일리") {
          const response = await getKeywordsForUser(data.id);
          if (response.some((keyword: Keyword) => keyword.period === "D")) {
            setHasDailyAlertKeyword(true);
          } else {
            await addKeywordForUser(data.id, keyword.daily, topic, "D");
          }
        } else {
          const response = await getKeywordsForUser(data.id);
          if (response.some((keyword: Keyword) => keyword.period === "W")) {
            setHasDailyAlertKeyword(true);
          } else {
            await addKeywordForUser(data.id, keyword.weekly, topic, "W");
          }
        }
      } catch (error: any) {
        // 404 에러가 발생할 때 addKeywordForUser 호출
        if (error.message.includes("404")) {
          console.log(
            "404 에러 발생: 키워드가 없으므로 새로운 키워드를 추가합니다."
          );
          if (currentTab == "데일리") {
            await addKeywordForUser(data.id, keyword.daily, topic, "D");
          } else {
            await addKeywordForUser(data.id, keyword.weekly, topic, "W");
          }
        } else {
          console.error("API 호출 중 오류 발생:", error);
        }
      }
    }
  };
  const closePopup = () => {
    setIsPopupVisible(false); // 팝업 닫기
    setAlertPopupVisible(false);
    setHasDailyAlertKeyword(false);
  };

  // 유저 정보가 있을 때 API 호출
  useEffect(() => {
    if (currentUser.email !== "") {
      console.log(currentUser);
      const data = getUserByEmail(currentUser.email);
    }
  }, [currentUser]);

  const createOrFetchUser = async (email: string, name: string) => {
    try {
      const response = await fetch("https://youticle.shop/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log("유저 정보:", data);
      // // 키워드가 있다면 대기 페이지로 이동
      // getKeywordReportsForUser(data.id);
      return data;
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
    }
  };

  const getUserByEmail = async (email: string): Promise<void> => {
    const url = `https://youticle.shop/users/${encodeURIComponent(email)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("User data:", data);
        await getKeywordsForUser(data.id);
      } else if (response.status === 404) {
        console.error("User not found.");
      } else {
        console.error(`Error: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const addKeywordForUser = async (
    userId: number,
    keyword: string,
    category: string,
    period: string
  ) => {
    try {
      console.log(keyword, category, userId, period);
      if (keyword && category && userId) {
        console.log(keyword, category, userId);
        const response = await fetch("https://youticle.shop/keyword/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            keyword: keyword,
            category: category,
            period: period, // 'D' -> Daily, 'W' -> Weekly
          }),
        });
        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log("키워드 추가 결과:", data);
        if (period === "D") {
          setHasDailyKeyword(true);
        } else {
          setHasWeeklyKeyword(true);
        }
        return data;
      }
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
    }
  };

  const getKeywordsForUser = async (userId: number) => {
    try {
      if (userId) {
        const response = await fetch(
          `https://youticle.shop/keyword/keywords/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log("키워드 정보:", data);
        // 키워드 중 period가 "D"인 경우 hasDailyKeyword를 true로 설정
        if (data.some((keyword: Keyword) => keyword.period === "D")) {
          setHasDailyKeyword(true);
        } else {
          setHasDailyKeyword(false);
        }

        // 키워드 중 period가 "W"인 경우 hasWeeklyKeyword를 true로 설정
        if (data.some((keyword: Keyword) => keyword.period === "W")) {
          setHasWeeklyKeyword(true);
        } else {
          setHasWeeklyKeyword(false);
        }

        return data;
      } else {
        console.log("user_id가 필요합니다.");
      }
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      throw error; // catch 문에서 이 에러를 처리할 수 있도록 던짐
    }
  };

  return (
    <Container>
      <LogoHeader />
      <ServiceContents>
        <Tabs>
          <Tab
            $isSelected={currentTab === "데일리"}
            onClick={() => handleTabClick("데일리")}
          >
            데일리
          </Tab>
          <Tab
            $isSelected={currentTab === "위클리"}
            onClick={() => handleTabClick("위클리")}
          >
            위클리
          </Tab>
        </Tabs>
        {/* 키워드가 있는 주기 타입에 따른 컴포넌트 전환 */}
        {hasDailyKeyword &&
        currentTab === "데일리" &&
        userState.email !== "" ? (
          <Information keyword={keyword.daily} />
        ) : hasWeeklyKeyword &&
          currentTab === "위클리" &&
          userState.email !== "" ? (
          <Information keyword={keyword.weekly} />
        ) : (
          <>
            <InputSection>
              <Title>
                {currentTab === "데일리" ? "매일" : "매주"} 키워드 관련된 최신
                유튜브 영상을 아티클로 읽어드립니다.
              </Title>
              <KeywordInput
                type="text"
                value={currentTab === "데일리" ? keyword.daily : keyword.weekly}
                onChange={(e) => handleChangeKeyword(e, currentTab)}
                placeholder="관심 키워드를 등록해주세요!"
              />
              <Dropdown topic={topic} handleChangeTopic={handleChangeTopic} />
              {topic === "기타" && (
                <KeywordInput
                  type="text"
                  value={directTopic}
                  onChange={(e) => handleChangeDirectTopic(e)}
                  placeholder="키워드 주제를 직접 입력해주세요!"
                />
              )}
              <ServiceButton onClick={handleServiceButtonClick}>
                {currentTab === "데일리" ? "데일리" : "위클리"} 구독하기
              </ServiceButton>
            </InputSection>
            <ServiceDescription currentTab={currentTab} />
            <SampleArticle />
          </>
        )}
      </ServiceContents>
      <Footer />
      {isPopupVisible && (
        <LoginPopup
          closePopup={closePopup}
          handleLoginSuccess={handleLoginSuccess}
          currentTab={currentTab}
          keyword={keyword}
        />
      )}
      {alertPopupVisible && <AlertPopup closePopup={closePopup} />}
      {hasDailyAlertKeyword && <KeywordAlertPopup closePopup={closePopup} />}
    </Container>
  );
};

export default My;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Pretendard Variable";
  padding-top: 66px;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-y: scroll;
`;

const ServiceContents = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Tabs = styled.div`
  width: 100%;
  height: 46px;
  display: flex;
`;

const Tab = styled.div<{ $isSelected: boolean }>`
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px 8px 0px 0px;
  background-color: ${({ $isSelected }) =>
    $isSelected ? "#30d5c8" : "#D9D9D9"};

  font-size: 16px;
  font-weight: 600;
  color: ${({ $isSelected }) => ($isSelected ? "#000000" : "#6A6A6A")};
`;

const InputSection = styled.div`
  display: flex;
  height: auto;
  flex-direction: column;
  padding: 28px 20px 48px 20px;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  text-align: left;
`;

const KeywordInput = styled.input`
  height: 52px;
  border: none;
  border-radius: 4px;
  background-color: #f3f3f3;
  padding: 16px 21px;
  margin-top: 16px;
  margin-bottom: 16px;

  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 600;
  line-height: 19.09px;
  text-align: left;

  &::placeholder {
    color: #939393;
    font-size: 16px;
    font-weight: 600;
    line-height: 19.09px;
    text-align: left;
  }

  &:focus {
    outline: none;
  }
`;

const ServiceButton = styled.button`
  width: 100%;
  height: 60px;
  background-color: #007bff;
  color: #ffffff;
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  margin-top: 26px;
`;

// 팝업 오버레이 스타일
const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); // 투명한 검은색 배경
  display: flex;
  justify-content: center;
  align-items: center;
`;

// 팝업 스타일
const Popup = styled.div`
  width: 300px;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PopupTitle = styled.h2`
  font-size: 18px;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 100px;
  height: 40px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const NewComponent = styled.div``;
