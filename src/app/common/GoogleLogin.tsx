"use client";

import styled, { css } from "styled-components";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { userState } from "@/store/user";
import { auth } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface GoogleLoginProps {
  variant: "button" | "link";
  text: string;
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({ variant, text }) => {
  const setUser = useSetRecoilState(userState);
  const currentUser = useRecoilValue(userState); // userState 값을 읽음

  const provider = new GoogleAuthProvider();

  const signInGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      setUser({
        name: user.displayName,
        email: user.email,
        picture: user.photoURL,
      });
    } catch (e) {
      console.error(e);
    }
  };
  console.log(currentUser);

  return (
    <StyledComponent
      as={variant === "link" ? "a" : "button"}
      onClick={signInGoogle}
      $variant={variant}
    >
      {text}
    </StyledComponent>
  );
};
export default GoogleLogin;

interface StyledComponentProps {
  $variant: "button" | "link";
}

const StyledComponent = styled.div<StyledComponentProps>`
  font-family: "Pretendard Variable";
  font-weight: 700;

  ${({ $variant }) =>
    $variant === "button"
      ? css`
          width: calc(100% - 40px);
          height: 60px;
          padding: 20px 0;
          border-radius: 4px;
          background-color: #007bff;
          font-size: 16px;
          line-height: 22px;
          color: white;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        `
      : css`
          border: none;
          border-bottom: 1px solid rgba(0, 123, 255, 1);
          background-color: white;
          font-size: 16px;
          line-height: 15.51px;
          color: rgba(0, 123, 255, 1);
          cursor: pointer;
          margin-top: 4px;
        `}
`;
