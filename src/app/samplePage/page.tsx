"use client";

import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import YouTube, { YouTubeProps } from "react-youtube";
import { useRecoilValue, useSetRecoilState } from "recoil";
import LogoHeader from "@/common/LogoHeader";
import Contents from "./components/Contents";
import { formatSummary } from "@/utils/formatter";
import { playerState } from "@/store/player";
import { isDesktop } from "react-device-detect";
import Footer from "@/components/Footer";

const DETAIL_DATA = {
  video_id: "HULbCjTw3tw",
  title: "Michael Burry Was RIGHT About Alibaba Stock! BABA To The Moon!",
  section: "주식",
  upload_date: "2024-09-29T19:48:18+09:00",
  duration: "PT9M27S",
  thumbnail: "https://i.ytimg.com/vi/HULbCjTw3tw/sddefault.jpg",
  views: 2289,
  likes: 98,
  comments: 72,
  subscribers: 0,
  score: 0.926043812020221,
  summary_data: {
    headline_title: "알리바바 급등의 비밀",
    headline_sub_title: "왜 지금 알리바바를 주목해야 할까?",
    short_summary:
      "알리바바의 주가는 최근 20% 상승하며 투자자들의 관심을 끌고 있습니다. 중국 정부의 경제 부양책과 함께, 알리바바의 저평가가 해소되며 주가가 급등하고 있는 상황이에요. 특히, 마이클 부르의 알리바바 주식 보유량 증가가 주가 상승에 긍정적인 영향을 미치고 있어요.",
    section: [
      {
        title: "📈 알리바바 주가 급등의 원인",
        detail_contents:
          "알리바바의 주가는 최근 20% 상승하며 투자자들의 관심을 끌고 있습니다. <mark>중국 정부의 경제 부양책</mark>과 함께, 알리바바의 저평가가 해소되며 주가가 급등하고 있는 상황이에요. 특히, <mark>마이클 부르</mark>의 알리바바 주식 보유량 증가가 주가 상승에 긍정적인 영향을 미치고 있어요. 그는 1분기 동안 75,000주에서 125,000주로 보유량을 늘렸고, 6월에는 추가로 30,000주를 매입했어요. 이러한 움직임은 알리바바의 가치를 높게 평가하고 있다는 신호로 해석될 수 있어요.",
        start_time: "35.96",
        explanation_keyword: "중국 정부의 경제 부양책",
        explanation_description:
          "중국 정부가 경제 성장을 촉진하기 위해 시행하는 정책으로, 금리 인하 및 대출 지원 등을 포함합니다.",
      },
      {
        title: "💹 마이클 부르의 투자 전략",
        detail_contents:
          "마이클 부르는 알리바바의 저평가를 이유로 지속적으로 주식을 매입하고 있어요. 그는 <mark>중국 인터넷 주식</mark>에 대한 노출을 늘리고 있으며, JD.com과 같은 다른 중국 기업에도 투자하고 있어요. 그의 투자 전략은 알리바바의 가치를 높게 평가하고 있다는 것을 보여주며, 향후 주가 상승에 대한 기대감을 높이고 있어요. 하지만 그는 장기 보유보다는 단기 매매를 선호하는 경향이 있어요.",
        start_time: "161.72",
        explanation_keyword: "중국 인터넷 주식",
        explanation_description:
          "중국의 온라인 쇼핑, 소셜 미디어, 클라우드 서비스 등 다양한 분야에서 활동하는 기업들의 주식을 의미합니다.",
      },
      {
        title: "🚀 알리바바의 미래 전망",
        detail_contents:
          "알리바바는 앞으로도 긍정적인 전망을 가지고 있어요. <mark>중국 정부의 지원</mark>과 함께, 글로벌 경제 회복이 이루어질 경우 알리바바의 주가는 더욱 상승할 가능성이 높아요. 특히, 전자상거래와 클라우드 서비스 분야에서의 성장이 기대되고 있어요. 투자자들은 이러한 요소들을 고려하여 알리바바에 대한 투자를 검토해야 해요.",
        start_time: "283.68",
        explanation_keyword: "전자상거래",
        explanation_description:
          "온라인에서 상품이나 서비스를 거래하는 상업 활동을 의미합니다.",
      },
      {
        title: "🏦 중국의 금리 인하와 주식시장",
        detail_contents:
          "중국 정부는 최근 금리를 인하하고 대출 지원을 강화하여 <mark>주식시장</mark>을 부양하고 있어요. 이러한 조치는 알리바바와 JD.com과 같은 기업들의 주가에 긍정적인 영향을 미치고 있으며, 투자자들은 이러한 변화에 주목하고 있어요. 특히, <mark>부동산 시장</mark>의 회복이 주식시장에도 긍정적인 영향을 미칠 것으로 예상되고 있어요.",
        start_time: "310.88",
        explanation_keyword: "부동산 시장",
        explanation_description:
          "부동산 거래와 관련된 경제 활동을 포함하며, 주택 가격, 거래량 등이 주요 지표로 사용됩니다.",
      },
      {
        title: "📊 알리바바의 주가 차트 분석",
        detail_contents:
          "알리바바의 주가는 최근 몇 주 동안 급등세를 보이고 있어요. <mark>차트 분석</mark>에 따르면, 현재 주가는 121달러 근처에서 저항을 받고 있으며, 이 지점을 넘어서면 추가 상승이 가능할 것으로 보입니다. 하지만 단기적으로는 조정이 있을 수 있어요. 투자자들은 이러한 차트 패턴을 주의 깊게 살펴봐야 해요.",
        start_time: "496.919",
        explanation_keyword: "차트 분석",
        explanation_description:
          "주식의 가격 변동을 시각적으로 나타내어 투자 결정을 돕는 기법입니다.",
      },
      {
        title: "📉 단기 조정 가능성",
        detail_contents:
          "알리바바의 주가는 급등세를 보이고 있지만, 단기적으로는 <mark>조정</mark>이 있을 가능성이 있어요. 투자자들은 주가가 121달러에 도달할 경우, 매도 압력이 증가할 수 있다는 점을 유의해야 해요. 이러한 조정은 시장의 자연스러운 현상으로, 장기 투자자에게는 기회가 될 수 있어요.",
        start_time: "532.279",
        explanation_keyword: "조정",
        explanation_description:
          "주가가 급등한 후 일시적으로 하락하는 현상을 의미합니다.",
      },
    ],
    views: 2289,
    likes: 98,
    comments: 72,
    subscribers: 0,
    score: 0.926043812020221,
  },
  channel_details: {
    channel_id: "UCjsm-25chou6wFu50erRtCg",
    channel_name: "Two Stupid Guys Trade Stocks",
    channel_subscribers: 8740,
    channel_video_count: 651,
    channel_view_count: 1013660,
    channel_thumbnail:
      "https://yt3.ggpht.com/ytc/AIdro_m_lKcKQtls6T29Px88AxZeRn7QLt0Rl2oeCsLTAhiRXw=s88-c-k-c0x00ffffff-no-rj",
    channel_banner:
      "https://yt3.ggpht.com/ytc/AIdro_m_lKcKQtls6T29Px88AxZeRn7QLt0Rl2oeCsLTAhiRXw=s800-c-k-c0x00ffffff-no-rj",
  },
};

const DETAIL_THUMBNAILS = [
  "blob:http://localhost:3000/3dceb268-7858-43fc-b514-b2f42ad76915",
  "blob:http://localhost:3000/6ef20a8b-a730-4941-aa26-68d25c87ff73",
  "blob:http://localhost:3000/c77e0637-7d1b-4e5e-b590-deb0d3cc2136",
  "blob:http://localhost:3000/5ca69451-ed4d-4b49-9ecd-d29cc7c9f64a",
  "blob:http://localhost:3000/32ff26ea-db0e-4b1e-855a-0f48f64fac0c",
  "blob:http://localhost:3000/22f6722a-bcd5-4282-835e-f41b8c4b0e28",
];

const SamplePage = () => {
  const [videoPlayer, setVideoPlayer] = useState<any>(null);
  const [isFixed, setIsFixed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isPlayerVisible = useRecoilValue(playerState);
  const setIsPlayerVisible = useSetRecoilState(playerState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    setVideoPlayer(event.target);
    setIsLoading(false);
  };

  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    if (!event.data) {
      const player = event.target;
      player.playVideo();
    }
  };

  const handleTocItemClick = (start: number) => {
    if (!isPlayerVisible) setIsPlayerVisible(true);

    if (videoPlayer) {
      videoPlayer.seekTo(start, true);
      videoPlayer.playVideo();
    }
  };

  const opts: YouTubeProps["opts"] = {
    height: "202",
    playerVars: {
      autoplay: 1,
      rel: 0,
      disablekb: 1,
    },
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollRefTop = scrollRef.current.getBoundingClientRect().top;
        setIsFixed(scrollRefTop <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();
    setIsLoading(true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Container $isFixed={isFixed}>
      <LogoHeader
        title={
          isFixed
            ? `${DETAIL_DATA.summary_data.headline_title}, ${DETAIL_DATA.summary_data.headline_sub_title}`
            : ""
        }
      />
      <PageInfo ref={scrollRef}>
        <Category>{DETAIL_DATA.section}</Category>
        <Title>
          {DETAIL_DATA.summary_data.headline_title},
          <br />
          {DETAIL_DATA.summary_data.headline_sub_title}
        </Title>
        <Upload>{DETAIL_DATA.upload_date} 업로드</Upload>
      </PageInfo>
      <VideoContainer
        ref={videoContainerRef}
        $isFixed={isFixed}
        $isDesktop={isDesktop}
      >
        {isLoading && <Loader />}
        <YouTube
          videoId="HULbCjTw3tw"
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          style={{
            display: isLoading ? "none" : isPlayerVisible ? "block" : "none",
          }}
        />
      </VideoContainer>

      <Preview $isFixed={isFixed}>
        <div>
          <span>🔎 미리보기</span>
          {formatSummary(DETAIL_DATA.summary_data.short_summary)}
        </div>
      </Preview>
      <TOC>
        <div>목차</div>
        <div>
          {DETAIL_DATA.summary_data.section.map(({ title }, index) => (
            <span key={index}>{title} </span>
          ))}
        </div>
      </TOC>
      <Contents
        detailData={DETAIL_DATA}
        thumbnails={DETAIL_THUMBNAILS}
        handleTocItemClick={handleTocItemClick}
      />
      <Footer />
    </Container>
  );
};

export default SamplePage;

const Container = styled.div<{ $isFixed: boolean }>`
  display: flex;
  flex-direction: column;
  font-family: "Pretendard Variable";
  padding-top: 76px;
  background-color: white;
`;

const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  margin-bottom: 16px;
`;

const Category = styled.span`
  font-size: 16px;
  font-weight: 600;
  line-height: 19.09px;
  color: rgba(48, 213, 200, 1);
  margin-bottom: 12px;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 800;
  line-height: 24px;
  margin-bottom: 4px;
`;

const Upload = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 14.4px;
`;

const Preview = styled.div<{ $isFixed: boolean }>`
  padding: 20px;
  margin-top: ${(props) => (props.$isFixed ? "176px" : "28px")};

  div {
    display: flex;
    flex-direction: column;
    background-color: #f2f2f2;
    padding: 20px;
    gap: 12px;
  }

  span {
    display: block;
    font-family: "Pretendard Variable";
    font-size: 16px;
  }

  span:first-child {
    font-weight: 600;
  }

  span.line-break {
    font-weight: 400;
    line-height: 160%;
    margin-bottom: 8px;
  }
`;

const TOC = styled.div`
  margin-top: 24px;
  padding: 0 20px;

  div:first-child {
    height: 44px;
    padding: 10px 16px 10px 16px;
    background-color: rgba(0, 0, 0, 1);
    font-size: 20px;
    font-weight: 800;
    line-height: 24px;
    color: rgba(255, 255, 255, 1);
  }

  div:nth-child(2) {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background-color: rgba(242, 242, 242, 1);
    font-size: 18px;
    font-weight: 600;
    line-height: 19.09px;
  }
`;

const VideoContainer = styled.div<{ $isFixed: boolean; $isDesktop: boolean }>`
  position: ${(props) => (props.$isFixed ? "fixed" : "static")};
  top: ${(props) => (props.$isFixed ? "52px" : "auto")};
  left: ${(props) => (props.$isFixed ? "0" : "auto")};
  z-index: ${(props) => (props.$isFixed ? 1000 : 0)};
  display: flex;

  div {
    width: 100vw;

    iframe {
      width: 100vw;
      max-width: ${({ $isDesktop }) => ($isDesktop ? "420px" : "none")};
    }
  }
`;

const LoaderAnimation = keyframes`
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: 200px 0;
    }
`;

const Loader = styled.div`
  width: 360px;
  height: 202px;
  background: #f0f0f0;
  background-image: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${LoaderAnimation} 1.5s infinite;
`;
