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
    let userId;

    // Check currentTab and assign the appropriate taskId based on weekly or daily

    if (currentTab === "위클리" && weeklyTaskId.userId) {
      console.log("위클리", weeklyTaskId);
      userId = weeklyTaskId.userId;
    } else if (currentTab === "데일리" && dailyTaskId.userId) {
      console.log("데일리", dailyTaskId);
      userId = dailyTaskId.userId;
    }

    // If currentUser and taskId are available, fetch the report
    if (currentUser && userId) {
      getUserReport(Number(userId));
    }
  }, [currentUser, weeklyTaskId, dailyTaskId, currentTab]); // Add currentTab to dependencies

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
            <Title>로딩 중...</Title> // 데이터를 로딩 중일 때 표시할 메시지
          )
        ) : dailyData && dailyData.length > 0 ? (
          <Title>&quot;{dailyData[0]["keyword"]}&quot; 구독 중</Title>
        ) : (
          <Title>로딩 중...</Title> // 데이터를 로딩 중일 때 표시할 메시지
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
          <Info>로딩 중...</Info> // 데이터를 로딩 중일 때 표시할 메시지
        )
      ) : dailyData && dailyData.length > 0 ? (
        <Info>
          {today}, &quot;{dailyData[0]["keyword"]}&quot; 관련 유튜브 아티클
        </Info>
      ) : (
        <Info>로딩 중...</Info> // 데이터를 로딩 중일 때 표시할 메시지
      )}
      {/* 큰따옴표를 &quot;로 대체 */}
      <CountdownTimer scrollRef={scrollRef} />
      {currentTab === "위클리"
        ? weeklyData.map((item) => <ReportCard key={item.video_id} {...item} />)
        : dailyData.map((item) => <ReportCard key={item.video_id} {...item} />)}
    </Container>
  );
};

export default Report;

const Container = styled.div`
  background-color: #f2f2f2;
  display: flex;
  height: 80vh;
  flex-direction: column;
  padding: 12px;
`;
const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
