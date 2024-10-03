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

  const signInGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      setUser({
        name: user.displayName,
        email: user.email,
        picture: user.photoURL,
      });
      if (onLoginSuccess) {
        onLoginSuccess(user); // 로그인 성공 시 콜백 호출
      }
    } catch (e) {
      console.error("Error during login:", e);
    }
  };

  return (
    <StyledComponent onClick={signInGoogle}>
      <GoogleIcon />
      <Text>구글 계정으로 로그인</Text> {/* 텍스트 고정 */}
    </StyledComponent>
  );
};

export default GoogleLogin;

const StyledComponent = styled.div`
  font-family: "Pretendard Variable";
  font-weight: 700;
  width: calc(100% - 10px);
  height: 60px;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #000;
  background-color: #fff;
  font-size: 16px;
  line-height: 22px;
  color: black;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const Text = styled.div`
  margin-left: 12px;
`;
