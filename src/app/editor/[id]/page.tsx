import { Metadata } from "next";
import ClientSide from "./components/ClientSide";
import NotFoundPage from "./components/NotFound";
import { DataProps } from "@/types/dataProps";

interface DetailPageProps {
  params: {
    id: string;
  };
}

// Dynamically generate metadata based on fetched data
export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { id } = params;

  const response = await fetch(`https://youticle.shop/editor/article/${id}`);
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
  // Server-side data fetching using fetch with no-store
  const EDITOR_ARTICLE_API_LOCAL_URL = "http://0.0.0.0:8000/editor/all/article";
  const EDITOR_ARTICLE_API_URL = "https://youticle.shop/editor/all/article";
  const response = await fetch(`https://youticle.shop/editor/article/${id}`);
  if (!response.ok) {
    return <NotFoundPage />;
  }

  const data = await response.json();
  const detailData: DataProps | null = data[0] || null;
  if (!detailData) {
    return <NotFoundPage />;
  }

  return <ClientSide detailData={detailData} id={id} />;
}
