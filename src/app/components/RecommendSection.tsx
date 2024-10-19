import React from "react";
import styled from "styled-components";

const RecommendationContainer = styled.section`
  background-color: #fff;
  padding: 40px 32px;
  text-align: center;
  font-family: "Pretendard Variable";
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 40px;
  font-weight: 900;
`;

const RecommendationCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
  margin-bottom: 40px;
`;

const UserType = styled.div`
  background-color: #ffffff;
  border-radius: 10px;
  max-width: 500px;
  border-bottom: 1px solid #efefef;
  padding-bottom: 20px;
  text-align: left;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const UserTypeContainer = styled.div`
  display: flex;
`;

const UserTypeThumbnail = styled.div`
  display: flex;
`;

const UserTypeTitle = styled.div`
  font-size: 20px;
  line-height: 132%;
  font-weight: bold;
  margin-left: 20px;
  /* margin-bottom: 10px; */
  color: #000;
  align-items: center;
  display: flex;
`;

const UserTypeDescription = styled.p`
  font-size: 16px;
  color: #000;
  margin-top: 20px;
  line-height: 1.4;
`;

const RecommendationSection: React.FC = () => {
  return (
    <RecommendationContainer>
      <SectionTitle>🙋 이런 분들에게 유용해요!</SectionTitle>
      <RecommendationCards>
        <UserType>
          <UserTypeContainer>
            <UserTypeThumbnail>
              <img src="/images/recommend1.png" />
            </UserTypeThumbnail>
            <UserTypeTitle>
              트렌드에 민감한
              <br />
              20/30대 직장인, 대학생
            </UserTypeTitle>
          </UserTypeContainer>
          <UserTypeDescription>
            인공지능, 블록체인, 마케팅, 뷰티 트렌드 등의 국내/해외 업계 동향
            관련 영상을 얻고 싶지만 바쁜 업무로 인해 원하는 영상들을 모두
            시청하지 못하는 분들!
          </UserTypeDescription>
        </UserType>

        <UserType>
          <UserTypeContainer>
            <UserTypeThumbnail>
              <img src="/images/recommend2.png" />
            </UserTypeThumbnail>
            <UserTypeTitle>
              재테크에 관심이 많은
              <br />
              20/30대 직장인, 대학생
            </UserTypeTitle>
          </UserTypeContainer>
          <UserTypeDescription>
            주식/부동산/가상자산/경제/산업 등의 정보 습득을 위해 출퇴근, 등하교
            시 영상을 시청하지만 매일 쏟아지는 영상을 감당하기 어려워하시는
            분들!
          </UserTypeDescription>
        </UserType>

        <UserType>
          <UserTypeContainer>
            <UserTypeThumbnail>
              <img src="/images/recommend3.png" />
            </UserTypeThumbnail>
            <UserTypeTitle>
              바쁜 일상 속에서
              <br />
              핵심 정보만 빠르게 필요한 사람들
            </UserTypeTitle>
          </UserTypeContainer>
          <UserTypeDescription>
            연애/결혼, 뷰티/패션, 요리, 운동 등 다양한 관심사에 대해서 핵심
            정보를 빠르고 효율적으로 습득하고 싶으신 분들!
          </UserTypeDescription>
        </UserType>
      </RecommendationCards>
    </RecommendationContainer>
  );
};

export default RecommendationSection;
