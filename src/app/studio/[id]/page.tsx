import { Metadata } from "next";
import ClientSide from "./components/ClientSide";
// import NotFoundPage from "./components/NotFound";
import { DataProps } from "@/types/dataProps";
import NotFoundPage from "@/detail/[id]/components/NotFound";
import ClientSide2 from "./components/ClientSide2";

interface DetailPageProps {
  params: {
    id: string;
  };
}

// // Dynamically generate metadata based on fetched data
// export async function generateMetadata({
//   params,
// }: DetailPageProps): Promise<Metadata> {
//   const { id } = params;

//   const response = await fetch(`https://youticle.shop/editor/article/${id}`);
//   const data = await response.json();
//   const detailData = data[0];

//   return {
//     title: detailData?.summary_data.headline_title || "Detail Page",
//     description: detailData?.summary_data.short_summary || "Description",
//     openGraph: {
//       title: detailData?.summary_data.headline_title,
//       description: detailData?.summary_data.short_summary,
//       images: [{ url: detailData?.thumbnail }],
//     },
//   };
// }

// Main page component
export default async function AdminDetailPage({ params, searchParams }: any) {
  const { id } = params;
  const { source, task_id } = searchParams;

  //   console.log(id);
  //   // Server-side data fetching using fetch with no-store
  //   const EDITOR_ARTICLE_API_LOCAL_URL = "http://0.0.0.0:8000/editor/all/article";

  //   const EDITOR_ARTICLE_API_URL = "https://youticle.shop/editor/all/article";

  //   const response = await fetch(`http://0.0.0.0:8000/editor/article/${id}`);
  //   if (!response.ok) {
  //     return <NotFoundPage />;
  //   }

  //   const data = await response.json();
  //   console.log("test", data);

  //   const detailData: DataProps | null = data[0] || null;
  //   if (!detailData) {
  //     return <NotFoundPage />;
  //   }
  // const NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
  const NEXT_PUBLIC_API_BASE_URL = "https://youticle.shop";

  if (!task_id) {
    const EDITOR_ARTICLE_API_LOCAL_URL =
      "http://0.0.0.0:8000/editor/all/article";

    const EDITOR_ARTICLE_API_URL = "https://youticle.shop/editor/all/article";

    // task_id가 없는 경우 ClientSide 렌더링
    let apiUrl = "";
    if (source === "editor") {
      apiUrl = `${NEXT_PUBLIC_API_BASE_URL}/editor/article/${id}`;
    } else if (source === "briefing") {
      // default = briefing
      apiUrl = `${NEXT_PUBLIC_API_BASE_URL}/briefing/top_videos/${id}`;
    } else {
      apiUrl = `${NEXT_PUBLIC_API_BASE_URL}/editor/article/${id}`;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      return <NotFoundPage />;
    }

    const data = await response.json();
    console.log("test", data);
    return <ClientSide detailData={data[0]} id={id} />;
  }

  // task_id가 있는 경우 ClientSide2 렌더링
  return <ClientSide2 taskId={task_id} id={id} />;
}
