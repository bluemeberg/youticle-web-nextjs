import { useState } from "react";
import styled from "styled-components";
import ArrowIcon from "@/assets/arrowBottom.svg";
import { TOPIC_TAGS } from "@/constants/topic";

const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectOption = (option: any) => {
    setSelectedValue(option);
    setIsOpen(false);
  };

  return (
    <Container>
      <InputStyledDiv onClick={handleToggleDropdown}>
        <span>{selectedValue || "키워드 주제 선택"}</span>
        <ArrowIcon />
      </InputStyledDiv>

      {isOpen && (
        <DropdownList>
          {TOPIC_TAGS.map((option, index) => (
            <DropdownListItem
              key={index}
              onClick={() => handleSelectOption(option)}
            >
              {option}
            </DropdownListItem>
          ))}
        </DropdownList>
      )}
    </Container>
  );
};

export default Dropdown;

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const InputStyledDiv = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 21px;
  height: 52px;
  border-radius: 4px;
  background-color: #f3f3f3;
  cursor: pointer;

  span {
    color: #939393;
    font-size: 15px;
    font-weight: 600;
    line-height: 19.09px;
    text-align: left;
  }
`;

const DropdownList = styled.ul`
  position: absolute;
  top: 62px;
  width: 100%;
  height: 264px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: scroll;
  z-index: 1000;
`;

const DropdownListItem = styled.li`
  padding: 10px;
  font-family: "Pretendard Variable";
  font-size: 16px;
  font-weight: 600;
  line-height: 19.09px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: #f0f0f0;
  }
`;
