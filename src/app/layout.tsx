"use client";

import styled from "styled-components";
import GlobalStyle from "./styles/GlobalStyles";
import { isDesktop } from "react-device-detect";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RecoilRoot } from "recoil";
import StyledComponentsRegistry from "./lib/registry";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClientDesktop, setIsClientDesktop] = useState(false);
  useEffect(() => {
    // 클라이언트에서만 isDesktop 값을 설정
    setIsClientDesktop(isDesktop);
  }, []);
  return (
    <html>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          as="style"
          crossOrigin="anonymous"
        />
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-VN0ZH9YB60"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VN0ZH9YB60');
            `,
          }}
        />
      </head>
      <body>
        <RecoilRoot>
          <StyledComponentsRegistry>
            <AppContainer>
              <GlobalStyle />
              <ScrollToTop />
              {children}
            </AppContainer>
          </StyledComponentsRegistry>
        </RecoilRoot>
      </body>
    </html>
  );
}

const AppContainer = styled.div`
  width: 100vw;
  max-width: none;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  background-color: white;

  ::-webkit-scrollbar {
    display: none;
  }

  @media screen and (min-width: 430px) {
    max-width: 430px;
  }
`;

const IframeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 52px;
`;
function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
