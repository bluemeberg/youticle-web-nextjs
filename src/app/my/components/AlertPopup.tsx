import styled from "styled-components";

const AlertPopup = ({ closePopup }) => {
  return (
    <PopupOverlay onClick={closePopup}>
      <Popup>
        <PopupTitle>🚨 키워드, 주제를 모두 입력해주세요!</PopupTitle>
        <CloseButton onClick={closePopup}>닫기</CloseButton>
      </Popup>
    </PopupOverlay>
  );
};

export default AlertPopup;

// 팝업 오버레이 스타일
const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); // 투명한 검은색 배경
  display: flex;
  justify-content: center;
  align-items: center;
`;

// 팝업 스타일
const Popup = styled.div`
  width: 300px;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PopupTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  width: 100px;
  height: 32px;
  background-color: #000;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
`;
