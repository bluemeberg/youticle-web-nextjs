"use client";

import styled, { css } from "styled-components";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { auth } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import GoogleIcon from "@/assets/google_icon.svg";

interface GoogleLoginProps {
  variant: "button" | "link";
  text: string;
  onLoginSuccess?: (user: any) => void; // 로그인 성공 시 호출될 콜백 함수
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({
  variant,
  text,
  onLoginSuccess,
}) => {
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
        onLoginSuccess(user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <StyledComponent
      as={variant === "link" ? "a" : "button"}
      onClick={signInGoogle}
      $variant={variant}
    >
      <GoogleIcon />
      <Text>{text}</Text>
    </StyledComponent>
  );
};
export default GoogleLogin;

const StyledComponent = styled.div`
  font-family: "Pretendard Variable";
  font-weight: 700;
  width: calc(110% - 40px);
  height: 60px;
  padding: 20px 0;
  border-radius: 4px;
  border : 1px solid #000
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
