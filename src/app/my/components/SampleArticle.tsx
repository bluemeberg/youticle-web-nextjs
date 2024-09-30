"use client";

import styled from "styled-components";
import SampleCard from "./SampleCard";

const SampleArticle = () => {
  return (
    <Container>
      <ComponentTitle>👀 샘플 아티클</ComponentTitle>
      <SampleCard />
    </Container>
  );
};

export default SampleArticle;

const Container = styled.div`
  width: 100%;
  background-color: rgba(242, 242, 242, 1);
  padding: 20px 13px 50px 11px;
`;

const ComponentTitle = styled.div`
  font-family: "Pretendard Variable";
  font-size: 20px;
  font-weight: 700;
  line-height: 22px;
  text-align: left;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(187, 187, 187, 1);
  margin-bottom: 16px;
`;
