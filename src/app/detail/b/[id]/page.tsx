import { Metadata } from "next";
import ClientSide from "./components/ClientSide";
import NotFoundPage from "./components/NotFound";
import { DataProps } from "@/types/dataProps";
import { headers } from "next/headers";

interface DetailPageProps {
  params: {
    id: string;
  };
}

async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 1000
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Dynamically generate metadata based on fetched data
export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { id } = params;

  const response = await fetch(
    `https://youticle.shop/briefing/top_videos/${id}`
  );
  const data = await response.json();
  const detailData = data[0];

  return {
    title: detailData?.summary_data.headline_title || "Detail Page",
    description: detailData?.summary_data.short_summary || "Description",
    openGraph: {
      title: detailData?.summary_data.headline_title,
      description: detailData?.summary_data.short_summary,
      images: [{ url: detailData?.thumbnail }],
    },
  };
}

// Main page component
export default async function DetailPage({ params }: DetailPageProps) {
  const { id } = params;
  // 1) 국가 헤더 읽기
  const hdrs = headers();
  // Vercel에서는 x-vercel-ip-country, Cloudflare는 cf-ipcountry
  const country =
    hdrs.get("x-vercel-ip-country") ?? hdrs.get("cf-ipcountry") ?? "Unknown";
  const acceptLanguage = hdrs.get("accept-language") ?? "";
  const userAgent = hdrs.get("user-agent") ?? "";
  const referer = hdrs.get("referer") ?? "";

  // 2) 이 네 가지를 하나의 객체로 묶기
  const clientContext = {
    country,
    acceptLanguage,
    userAgent,
    referer,
  };
  // const data = await fetchWithRetry(
  //   `https://youticle.shop/briefing/top_videos/${id}`
  // );
  const response = await fetch(
    `https://youticle.shop/briefing/top_videos/${id}`
  );

  // const response = await fetch(`http://0.0.0.0:8000/briefing/top_videos/${id}`);
  if (!response.ok) {
    return <NotFoundPage />;
  }

  const data = await response.json();
  const detailData: DataProps | null = data[0] || null;

  if (!detailData) {
    return <NotFoundPage />;
  }

  return (
    <ClientSide detailData={detailData} id={id} clientContext={clientContext} />
  );
}
