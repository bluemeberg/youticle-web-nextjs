// NewComponent.tsx
import React, { useEffect } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { dailyKeywordTaskState } from "@/store/dailyTaskId";
import { weeklyKeywordTaskState } from "@/store/weeklyTaskId";
import Loading from "@/assets/loading.svg";
import { userState } from "@/store/user";

import Cook from "@/assets/yosum_cook.svg";
interface NewComponentProps {
  keyword: string;
  currentTab: string;
}

const Progress: React.FC<NewComponentProps> = ({ keyword, currentTab }) => {
  //  이메일정보로 userid 가져오고,
  // taskid 받아와서 recoilstate로 저장

  const currentUser = useRecoilValue(userState); // userState 값을 읽음
  const dailyTaskId = useRecoilValue(dailyKeywordTaskState); // userState 값을 읽음
  const weeklyTaskId = useRecoilValue(weeklyKeywordTaskState);

  // taskid에 대한 상태 가져오기
  const getTaskId = async () => {
    if (currentTab === "데일리") {
      const url = `https://claying.shop/keyword/status/${dailyTaskId.taskId}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("get daily Task status:", data);
          return data;
        } else if (response.status === 404) {
          console.error("User not found.");
        } else {
          console.error(`Error: ${response.status}, ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    } else {
      console.log();
      const url = `https://claying.shop/keyword/status/${weeklyTaskId.taskId}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("get weekly Task status:", data);
          return data;
        } else if (response.status === 404) {
          console.error("User not found.");
        } else {
          console.error(`Error: ${response.status}, ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
  };

  // res
  const processing = async () => {
    const taskInfo = await getTaskId();
  };

  // 유저 정보가 있을 때 API 호출
  useEffect(() => {
    if (currentUser.email !== "") {
      processing();
    }
  }, [currentUser]);

  const router = useRouter();

  const goToPage = (url: string) => router.push(url);

  return (
    <Container>
      <Logo>YouTicle</Logo>
      <Description>
        {keyword} 관련된
        <br />
        유튜브 아티클 생성중...
        <br />
        최대 1분 정도 소요 될 수 있습니다!
      </Description>
      <Loading />
      <CookBox>
        <Cook />
        <CookDescription>
          기다리시는동안 오늘 업로드된 19가지 주제의 유튜브 아티클을
          확인해보세요!
        </CookDescription>
      </CookBox>
      <ServiceButton onClick={() => goToPage("/")}>
        오늘의 유튜브 아티클 보러가기
      </ServiceButton>
    </Container>
  );
};

export default Progress;

const Container = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled.div`
  font-size: 40px;
  font-weight: 700;
  margin-top: 32px;
  margin-bottom: 32px;
`;

const Description = styled.div`
  display: flex;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  line-height: 132%;
`;

const CookBox = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const CookDescription = styled.div`
  font-size: 16px;
  margin-bottom: 10px;
  background-color: #f1f1f1;
  padding: 20px;
  width: 220px;
  border-radius: 8px;
  line-height: 136%;
  margin-top: 20px;
  margin-left: 8px;
`;

const ServiceButton = styled.button`
  width: calc(100vw - 32px);
  height: 60px;
  background-color: #007bff;
  color: #ffffff;
  font-family: "Pretendard Variable";
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  margin-top: 20px;
  border-radius: 4px;
  margin-bottom: 40px;
`;
