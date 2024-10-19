"use client";

import styled from "styled-components";
import ScrollTopIcon from "@/assets/ScrollTopIcon.svg"; // ?react 쿼리 없이 svg를 불러옵니다.

interface GoToTopBtnProps {
  isVisible: boolean;
}

const GoToTopBtn = ({ isVisible }: GoToTopBtnProps) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container onClick={scrollToTop} $isVisible={isVisible}>
      <ScrollTopIcon />
    </Container>
  );
};

export default GoToTopBtn;

const Container = styled.button<{ $isVisible: boolean }>`
  /* width: 40px;
  height: 40px; */
  position: fixed;
  bottom: 32px;
  right: 16px;
  visibility: ${(props) => (props.$isVisible ? "visible" : "hidden")};
  background-color: transparent;
  /* border-radius: 50%;
  border: none; */
  z-index: 10000;

  /* display: flex;
  justify-content: center;
  align-items: center;

  svg {
    width: 20px !important;
    height: 20px !important;
  } */
`;
