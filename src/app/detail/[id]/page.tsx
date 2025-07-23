// app/detail/[id]/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default function RedirectDetail({ params: { id } }: Props) {
  const cookieStore = cookies();
  let variant = cookieStore.get("detailVariant")?.value;

  // 쿠키가 없으면 50:50 랜덤, 최대 30일 유지
  if (!variant) {
    variant = Math.random() < 0.5 ? "b" : "b";
    cookieStore.set("detailVariant", variant, {
      path: "/detail",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // variant-specific 페이지로 즉시 리다이렉트
  redirect(`/detail/${variant}/${id}`);
}
