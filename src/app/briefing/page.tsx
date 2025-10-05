import BriefingPageClient from "./components/ClientSide"; // 클라이언트 컴포넌트

export const metadata = {
  title: "YouTicle",
  description:
    "구독 채널의 개별 영상 즉시 요약부터 신규 영상의 자동 요약 & 카톡알림까지, 나만의 유튜브 AI비서 - 유티클",
  openGraph: {
    title: "YouTicle",
    description:
      "구독 채널의 개별 영상 즉시 요약부터 신규 영상의 자동 요약 & 카톡알림까지, 나만의 유튜브 AI비서 - 유티클",
    images: [
      {
        url: "/images/YouTicleOGThumbnail2.png", // public 폴더 내의 경로
        alt: "Thumbnail Image",
      },
    ],
    icons: {
      icon: "/favicon.png", // favicon 경로
    },
  },
};

export default async function BriefingPage() {
  return (
    <>
      <BriefingPageClient />
    </>
  );
}
