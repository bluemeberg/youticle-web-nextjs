import styled from "styled-components";
import Dropdown from "./Dropdown";
import ServiceDescription from "./ServiceDescription";
import SampleArticle from "./SampleArticle";

interface KeywordInputFormProps {
  currentTab: string;
  keyword: any;
  topic: string;
  directTopic: string;
  handleChangeKeyword: (e: any, currentTab: string) => void;
  handleChangeTopic: (option: string) => void;
  handleChangeDirectTopic: (e: any) => void;
  handleServiceButtonClick: () => void;
}

const KeywordInputForm: React.FC<KeywordInputFormProps> = ({
  currentTab,
  keyword,
  topic,
  directTopic,
  handleChangeKeyword,
  handleChangeTopic,
  handleChangeDirectTopic,
  handleServiceButtonClick,
}) => {
  return (
    <>
      <InputSection>
        <Title>
          {currentTab === "데일리" ? "매일" : "매주"} 키워드 관련된 최신 유튜브
          영상을 아티클로 빠르고 편하게 읽어드립니다.
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
  );
};

export default KeywordInputForm;

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
