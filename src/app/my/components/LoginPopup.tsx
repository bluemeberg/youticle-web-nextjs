import styled from "styled-components";
import GoogleLogin from "@/common/MyArticleGoogleLogin";

const LoginPopup = ({
  closePopup,
  handleLoginSuccess,
  currentTab,
  keyword,
}) => {
  return (
    <PopupOverlay onClick={closePopup}>
      <Popup>
        <CloseButton onClick={closePopup}>X</CloseButton>
        <PopupTitle>로그인이 필요합니다.</PopupTitle>
        <PopupDescription>
          구글 계정 연동하고<br></br>"
          {currentTab === "데일리" ? keyword.daily : keyword.weekly}" 유튜브
          아티클을<br></br> 매일 구글 이메일로도 받아보세요!
        </PopupDescription>
        <GoogleLogin
          variant="button"
          text="구글 계정으로 시작하기"
          onLoginSuccess={handleLoginSuccess}
        />
      </Popup>
    </PopupOverlay>
  );
};

export default LoginPopup;

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
  width: 340px;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const PopupTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
`;

const PopupDescription = styled.div`
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 20px;
  text-align: center;
  line-height: 120%;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: black;

  &:hover {
    color: red; // 호버 시 색상을 변경할 수 있습니다.
  }
`;
