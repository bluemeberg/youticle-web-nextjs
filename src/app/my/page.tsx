"use client";

import styled from "styled-components";
import LogoHeader from "@/common/LogoHeader";
import { useState, useEffect, useId } from "react";
import Dropdown from "./components/Dropdown";
import Footer from "@/components/Footer";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { keywordState } from "@/store/keyword";
import { dailyKeywordTaskState } from "@/store/dailyTaskId";

import ServiceDescription from "./components/ServiceDescription";
import SampleArticle from "./components/SampleArticle";
import { userState } from "@/store/user";
import AlertPopup from "./components/AlertPopup";
import LoginPopup from "./components/LoginPopup";
import KeywordAlertPopup from "./components/KeywordAlertPopup";
import Information from "./components/Information";
import Progress from "./components/Progress";
import KeywordInputForm from "./components/KeywordInputForm";
import { weeklyKeywordTaskState } from "@/store/weeklyTaskId";
import Report from "./components/Report";
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

const My = () => {
  const [currentTab, setCurrentTab] = useState("데일리");
  const [topic, setTopic] = useState("");
  const [directTopic, setDirectTopic] = useState("");
  const [keyword, setKeyword] = useRecoilState(keywordState);
  const [isPopupVisible, setIsPopupVisible] = useState(false); // 팝업 상태 관리
  const [alertPopupVisible, setAlertPopupVisible] = useState(false); // 경고 팝업 상태
  const [hasDailyKeyword, setHasDailyKeyword] = useState(false); // 새로운 컴포넌트 상태 관리
  const [hasWeeklyKeyword, setHasWeeklyKeyword] = useState(false); // 새로운 컴포넌트 상태 관리
  // daily task id 받아와서 recoilstate로 저장
  const setDailyKeywordTask = useSetRecoilState(dailyKeywordTaskState);
  // daily task id 받아와서 recoilstate로 저장
  const setWeeklyKeywordTask = useSetRecoilState(weeklyKeywordTaskState);
  const [hasDailyKeywordProgress, setHasDailyKeywordProgress] = useState(false); // 새로운 컴포넌트 상태 관리
  const [hasWeeklyKeywordProgress, setHasWeeklyKeywordProgress] =
    useState(false); // 새로운 컴포넌트 상태 관리

  const [hasDailyKeywordReport, setHasDailyKeywordReport] = useState(false); // 새로운 컴포넌트 상태 관리
  const [hasWeeklyKeywordReport, setHasWeeklyKeywordReport] = useState(false); // 새로운 컴포넌트 상태 관리

  const [hasAlertKeyword, setHasAlertKeyword] = useState(false);

  const currentUser = useRecoilValue(userState); // userState 값을 읽음
  const dailyTaskId = useRecoilValue(dailyKeywordTaskState); // userState 값을 읽음
  const weeklyTaskId = useRecoilValue(weeklyKeywordTaskState);

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
  const handleServiceButtonClick = async () => {
    if (
      (currentTab === "데일리" && !keyword.daily) ||
      (currentTab === "위클리" && !keyword.weekly) ||
      !topic ||
      (topic === "기타" && !directTopic)
    ) {
      setAlertPopupVisible(true); // 경고 팝업 보이기
    } else {
      if (currentUser.email == "") {
        setIsPopupVisible(true); // 팝업 보이기
      } else {
        await processing({
          email: currentUser.email,
          displayName: currentUser.name,
        });
      }
    }
  };

  const handleLoginSuccess = async (user: User) => {
    setIsPopupVisible(false); // 팝업 닫기
    await processing(user); // 로그인 후 키워드 추가
  };

  const processing = async (user: User) => {
    //
    if (user.email !== "") {
      // user 정보 등록 확인, 없으면 신규 등록함
      const data = await getUserByEmail(user.email);
      console.log("로그인 후 유저 정보", data);
      try {
        if (currentTab == "데일리") {
          const response = await getKeywordsForUser(data.id);
          // 이미 등록된 키워드 존재 여부 확인
          if (response.some((keyword: Keyword) => keyword.period === "D")) {
            setHasAlertKeyword(true);
            // /keyword/user_report_status 호출
            // 레포트가 true면 페이지 넘겨서 /keyword/user 호출
            // false면 recoil의 taskid 상태 확인
            // SUCCESS가 아니면 진행 중 화면으로 인동
          } else {
            // 등록된 키워드가 없다면
            await addKeywordForUser(data.id, keyword.daily, topic, "D");
            // 키워드 일회성 최초 동작
            const res = await executeFirstScehdule(data.id, "D");
            // 그리고 진행 중 컴포넌트 활성화
            setHasDailyKeywordProgress(true);
          }
        } else {
          const response = await getKeywordsForUser(data.id);
          if (response.some((keyword: Keyword) => keyword.period === "W")) {
            setHasAlertKeyword(true);
            // /keyword/user_report_status 호출
            // 레포트가 true면 페이지 넘겨서 /keyword/user 호출
            // false면 recoil의 taskid 상태 확인
            // SUCCESS가 아니면 진행 중 화면으로 인동
          } else {
            await addKeywordForUser(data.id, keyword.weekly, topic, "W");
            // 키워드 일회성 최초 동작
            const res = await executeFirstScehdule(data.id, "W");
            // 그리고 진행 중 컴포넌트 활성화
            setHasWeeklyKeywordProgress(true);
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
            // 키워드 일회성 최초 동작
            const res = await executeFirstScehdule(data.id, "D");
            // 그리고 진행 중 컴포넌트 활성화
            setHasDailyKeywordProgress(true);
          } else {
            await addKeywordForUser(data.id, keyword.weekly, topic, "W");
            // 키워드 일회성 최초 동작
            const res = await executeFirstScehdule(data.id, "W");
            // 그리고 진행 중 컴포넌트 활성화
            setHasWeeklyKeywordProgress(true);
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
    setHasAlertKeyword(false);
  };

  // taskid에 대한 상태 가져오기
  const getTaskId = async (taskId: string) => {
    const url = `https://claying.shop/keyword/status/${taskId}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("get Task data:", data);
        return data;
      } else if (response.status === 404) {
        console.error("User not found.");
      } else {
        console.error(`Error: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };
  // taskid에 대한 상태 가져오기
  const getUserReport = async (userId: number) => {
    const url = `https://claying.shop/keyword/user?user_id=${userId}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      // 성공적으로 데이터를 받아온 경우
      if (response.ok) {
        const data = await response.json();
        console.log("get user report data:", data);

        // period가 'D' 또는 'W'인 경우에 따른 분기 처리
        const hasDaily = data.some((item: any) => item.period === "D");
        const hasWeekly = data.some((item: any) => item.period === "W");

        if (hasDaily) {
          setHasDailyKeywordReport(true);
        }

        if (hasWeekly) {
          setHasWeeklyKeywordReport(true);
        }

        // 만약 둘 다 없다면 기존 taskId 처리
        if (!hasDaily && !hasWeekly) {
          await handleTaskIdFallback();
        }

        return data;
      } else if (response.status === 404) {
        console.error("User not found.");
      } else {
        console.error(`Error: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      await handleTaskIdFallback();
    }
  };

  // 기존 taskId를 가져오는 로직
  const handleTaskIdFallback = async () => {
    if (currentTab === "데일리") {
      console.log(dailyTaskId, "데일리 체크");
      const res = await getTaskId(dailyTaskId.taskId);
      if (res.status === "SUCCESS") {
        setHasDailyKeywordReport(true);
      } else {
        setHasDailyKeywordProgress(true);
      }
    } else if (currentTab === "위클리") {
      console.log(weeklyTaskId, "위클리 체크");
      const res = await getTaskId(weeklyTaskId.taskId);
      if (res.status === "SUCCESS") {
        setHasWeeklyKeywordReport(true);
      } else {
        setHasWeeklyKeywordProgress(true);
      }
    }
  };

  // 유저 정보가 있을 때 API 호출
  useEffect(() => {
    const fetchUser = async () => {
      if (currentUser.email !== "") {
        console.log("check", currentUser);
        try {
          const data = await getUserByEmail(currentUser.email);
          console.log("email check", data);
          // 이후의 유저 ID에 따라 로직 실행
          await getUserReport(data.id);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUser();
  }, [currentUser, currentTab]);

  // 유저 정보 최초 등록
  const createOrFetchUser = async (email: string) => {
    try {
      const response = await fetch("https://claying.shop/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
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

  // 유저 정보 가져오기
  const getUserByEmail = async (email: string): Promise<{ id: number }> => {
    const url = `https://claying.shop/users/${encodeURIComponent(email)}`;

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
        return data;
      } else if (response.status === 404) {
        console.error("User not found. Creating new user...");
        // 새로운 유저 생성 로직
        const newUser = await createOrFetchUser(email);
        console.log("New user created:", newUser);
        return newUser;
      } else {
        console.error(`Error: ${response.status}, ${response.statusText}`);
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  };

  // 키워드 등록하기
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
        const response = await fetch("https://claying.shop/keyword/", {
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
        // if (period === "D") {
        //   // 최초 등록 시 즉시 진행 중 화면 표출
        //   setHasDailyKeywordProgress(true);
        // } else {
        //   // 최초 등록 시 즉시 진행 중 화면 표출
        //   setHasWeeklyKeywordProgress(true);
        // }
        return data;
      }
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
    }
  };

  // 키워드 최초 일회성으로 실행시키기
  const executeFirstScehdule = async (id: number, type: string) => {
    const url = `https://claying.shop/keyword/schedule/${id}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("get Task data:", data);
        //   recoil state로 저장하기
        if (type === "D") {
          setDailyKeywordTask({
            taskId: data.task_id,
            userId: data.user_id,
            type: type,
          });
          setHasDailyKeywordProgress(true);
        } else {
          setWeeklyKeywordTask({
            taskId: data.task_id,
            userId: data.user_id,
            type: type,
          });
          setHasWeeklyKeywordProgress(true);
        }
        return data;
      } else if (response.status === 404) {
        console.error("User not found.");
      } else {
        console.error(`Error: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  // 유저가 등록한 키워드 확인하기
  const getKeywordsForUser = async (userId: number) => {
    try {
      if (userId) {
        const response = await fetch(
          `https://claying.shop/keyword/keywords/${userId}`,
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
        {hasDailyKeywordProgress &&
        currentTab === "데일리" &&
        currentUser.email !== "" ? (
          <Progress keyword={keyword.daily} currentTab={currentTab} />
        ) : hasWeeklyKeywordProgress &&
          currentTab === "위클리" &&
          currentUser.email !== "" ? (
          <Progress keyword={keyword.weekly} currentTab={currentTab} />
        ) : currentTab === "데일리" &&
          hasDailyKeywordReport &&
          currentUser.email !== "" ? (
          <Report currentTab={currentTab} />
        ) : currentTab === "위클리" &&
          hasWeeklyKeywordReport &&
          currentUser.email !== "" ? (
          <Report currentTab={currentTab} />
        ) : (
          <KeywordInputForm
            currentTab={currentTab}
            keyword={keyword}
            topic={topic}
            directTopic={directTopic}
            handleChangeKeyword={handleChangeKeyword}
            handleChangeTopic={handleChangeTopic}
            handleChangeDirectTopic={handleChangeDirectTopic}
            handleServiceButtonClick={handleServiceButtonClick}
          />
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
      {hasAlertKeyword && <KeywordAlertPopup closePopup={closePopup} />}
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
