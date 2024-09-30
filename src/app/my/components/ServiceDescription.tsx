import styled from "styled-components";
import FirstIcon from "@/assets/first.svg";
import SecondIcon from "@/assets/second.svg";
import ThirdIcon from "@/assets/third.svg";

const ServiceDescription = ({ currentTab }: { currentTab: string }) => {
  return (
    <Container>
      <BlockSection>
        <BlockTitle>
          📌 {currentTab === "데일리" ? "데일리" : "위클리"} 키워드 구독 기능
          소개
        </BlockTitle>
        <Block>
          <div>
            <FirstIcon /> 영상 선정 범위 : {currentTab === "데일리" ? "1" : "7"}
            일 전 ~ 오늘 업로드된 영상
          </div>
          <div>
            <SecondIcon /> 아티클 갯수 최대{" "}
            {currentTab === "데일리" ? "3" : "6"}개 제공
          </div>
          <div>
            <ThirdIcon /> 구독 즉시 첫 발행 후{" "}
            {currentTab === "데일리" ? "매일" : "매주"} 오전 7시에 발행{" "}
          </div>
        </Block>
      </BlockSection>
      <BlockSection>
        <BlockTitle> 🙋 이런 키워드를 추천해요!</BlockTitle>
        <Block>
          <div>
            <FirstIcon /> 정보의 소재가 시시각각 변하는 키워드
          </div>
          <div>
            <SecondIcon /> 매일 정보가 쏟아지는 소재
          </div>
          <div>
            💡 예시 : 엔비디아 - 주식 / GPT - 인공지능 / 아이폰16 - IT테크 등
          </div>
        </Block>
      </BlockSection>
      <BlockSection>
        <BlockTitle>🚨 이것만 주의해주세요!</BlockTitle>
        <Block>
          <span>
            주기가 짧기 때문에 정보가 많지 않은 키워드는 아티클이 제공되지 않을
            수 있습니다. 해당 키워드는 위클리 주기로 추천드립니다!
          </span>
        </Block>
      </BlockSection>
    </Container>
  );
};

export default ServiceDescription;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 24px 0 14px;
`;

const BlockSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 28px;
`;

const BlockTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  line-height: 22px;
  text-align: left;
  margin-bottom: 8px;
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 14px 20px 14px 20px;
  border: 1px solid #aeaeae;

  div {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
    text-align: left;
  }

  span {
    font-family: "Pretendard Variable";
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    text-align: left;
  }
`;
