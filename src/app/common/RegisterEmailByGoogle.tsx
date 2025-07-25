"use client";

import styled from "styled-components";
import { useSetRecoilState } from "recoil";
import { userState } from "@/store/user";
import { auth } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import GoogleIcon from "@/assets/google_icon.svg"; // Assuming you have this SVG

interface GoogleLoginProps {
  onLoginSuccess?: (user: any) => void; // 로그인 성공 시 호출될 콜백 함수
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({ onLoginSuccess }) => {
  const setUser = useSetRecoilState(userState);
  const provider = new GoogleAuthProvider();
  // provider.addScope("https://www.googleapis.com/auth/youtube.readonly");

  const signInGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // [4] Firebase가 발급한 credential에서 accessToken 추출
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const accessToken = credential?.accessToken;
      // console.log(accessToken);
      setUser({
        name: result.user.displayName,
        email: result.user.email,
        picture: result.user.photoURL,
      });
      if (onLoginSuccess) {
        onLoginSuccess(result.user); // 로그인 성공 시 콜백 호출
      }
    } catch (e) {
      console.error("Error during login:", e);
    }
  };

  return (
    <StyledComponent onClick={signInGoogle}>
      <GoogleIcon />
      <Text>구글 계정으로 신청하기</Text> {/* 텍스트 고정 */}
    </StyledComponent>
  );
};

export default GoogleLogin;

const StyledComponent = styled.div`
  font-family: "Pretendard Variable";
  font-weight: 700;
  width: calc(100%);
  height: 60px;
  padding: 20px;
  border-radius: 4px;
  /* border: 1px solid #000; */
  background-color: #007bff;
  font-size: 16px;
  line-height: 22px;
  color: #fff;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 12px;
`;

const Text = styled.div`
  margin-left: 12px;
`;
