// NewComponent.tsx
import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { dailyKeywordTaskState } from "@/store/dailyTaskId";
import { weeklyKeywordTaskState } from "@/store/weeklyTaskId";
import ReportCard from "../components/ReportCard";
import { userState } from "@/store/user";
import { ReportData } from "@/types/dataProps";
import CountdownTimer from "./ReportCountdownTimer";
interface ReportComponentProps {
  currentTab: string;
}

const Report: React.FC<ReportComponentProps> = ({ currentTab }) => {
  //  이메일정보로 userid 가져오고,
  const router = useRouter();
  const currentUser = useRecoilValue(userState); // userState 값을 읽음
  const dailyTaskId = useRecoilValue(dailyKeywordTaskState); // userState 값을 읽음
  const weeklyTaskId = useRecoilValue(weeklyKeywordTaskState);
  const [reportData, setReportData] = useState<ReportData[] | undefined>(
    undefined
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // 유저 정보 가져오기
  const getUserByEmail = async (
    email: string
  ): Promise<{ id: number } | undefined> => {
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
        return undefined; // 명시적으로 undefined 반환
      } else {
        console.error(`Error: ${response.status}, ${response.statusText}`);
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
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
      if (response.ok) {
        const data = await response.json();
        console.log("get user report data:", data);
        setReportData(data);
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

  useEffect(() => {
    const fetchUserAndReport = async () => {
      try {
        // 이메일을 통해 유저 정보 가져오기
        const userData = await getUserByEmail(currentUser.email);

        // 유저 ID를 기반으로 User Report 가져오기
        if (userData?.id) {
          await getUserReport(userData.id);
        }
      } catch (error) {
        console.error("Error fetching user and report:", error);
      }
    };

    if (currentUser && currentUser.email) {
      fetchUserAndReport();
    }
  }, [currentUser]); // currentUser가 변경될 때마다 실행

  // Split data based on the period, with null-checks for briefing_channel and other fields
  const weeklyData = reportData
    ? reportData.filter((item) => {
        // Check if the item and period exist and that the briefing_channel is not null
        return (
          item.period === "W" &&
          item.briefing_channel !== null &&
          item.briefing_video !== null
        );
      })
    : [];

  console.log(weeklyData);

  const dailyData = reportData
    ? reportData.filter((item) => {
        // Check if the item and period exist and that the briefing_channel is not null
        return item.period === "D";
      })
    : [];

  console.log(dailyData);

  function getFormattedDateAndDay(): string {
    const date = new Date();

    // 월, 일 가져오기
    const month = date.getMonth() + 1; // 월은 0부터 시작하므로 +1
    const day = date.getDate();

    // 요일 가져오기
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = daysOfWeek[date.getDay()];

    // 형식 맞추기
    const formattedDate = `${month}/${day}(${dayOfWeek})`;

    return formattedDate;
  }
  const today = getFormattedDateAndDay();

  return (
    <Container>
      <TitleContainer>
        {currentTab === "위클리" ? (
          weeklyData && weeklyData.length > 0 ? (
            <Title>&quot;{weeklyData[0]["keyword"]}&quot; 구독 중</Title>
          ) : (
            <Title>오늘 레포트가 생성되지 않았습니다.</Title> // 데이터를 로딩 중일 때 표시할 메시지
          )
        ) : dailyData && dailyData.length > 0 ? (
          <Title>&quot;{dailyData[0]["keyword"]}&quot; 구독 중</Title>
        ) : (
          <Title>오늘 레포트가 생성되지 않았습니다.</Title> // 데이터를 로딩 중일 때 표시할 메시지
        )}
        {/* 큰따옴표를 &quot;로 대체 */}
        <ChangeButton>수정</ChangeButton>
      </TitleContainer>
      {currentTab === "위클리" ? (
        weeklyData && weeklyData.length > 0 ? (
          <Info>
            {today}, &quot;{weeklyData[0]["keyword"]}&quot; 관련 유튜브 아티클
          </Info>
        ) : (
          <Info>오늘 레포트가 생성되지 않았습니다.</Info> // 데이터를 로딩 중일 때 표시할 메시지
        )
      ) : dailyData && dailyData.length > 0 ? (
        <Info>
          {today}, &quot;{dailyData[0]["keyword"]}&quot; 관련 유튜브 아티클
        </Info>
      ) : (
        <Info>오늘 레포트가 생성되지 않았습니다.</Info> // 데이터를 로딩 중일 때 표시할 메시지
      )}
      {/* 큰따옴표를 &quot;로 대체 */}
      <CountdownTimer scrollRef={scrollRef} />
      {currentTab === "위클리"
        ? weeklyData.map((item) => <ReportCard key={item.video_id} {...item} />)
        : dailyData.map((item) => <ReportCard key={item.video_id} {...item} />)}
      <ButtonContainer>
        <Button
          onClick={() => window.open("https://tally.so/r/w4vWqk", "_blank")}
        >
          서비스 개선 의견 공유하기 👉🏻
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default Report;

const Container = styled.div`
  background-color: #f2f2f2;
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 12px;
  padding-bottom: 100px;
`;
const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Button = styled.button`
  background-color: #000;
  color: white;
  font-size: 18px;
  font-weight: 700;
  padding: 12px 20px;
  width: 80%;
  border: none;
  border-radius: 5px;
  margin-top: 20px;
  cursor: pointer;
  &:hover {
    background-color: #000;
  }
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
  width: calc(100vw - 24px);
  line-height: 140%;
  margin-top: 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid #bbbbbb;
`;

const ChangeButton = styled.div`
  background-color: black;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-radius: 4px;
  width: 60px;
  height: 36px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Info = styled.div`
  display: flex;
  font-weight: 600;
  font-size: 16px;
  margin-top: 32px;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
