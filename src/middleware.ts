// middleware.ts (프로젝트 루트)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/detail/:path*"], // detail 하위 모든 경로에 적용
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  if (pathname.startsWith("/detail/a/") || pathname.startsWith("/detail/b/")) {
    return NextResponse.next();
  }

  // id 추출
  const [, , id, ...tail] = pathname.split("/");
  const variant =
    req.cookies.get("detailVariant")?.value ??
    (Math.random() < 0.5 ? "a" : "b");

  // 내부 경로는 원래대로, 단지 query만 붙임
  url.searchParams.set("variant", variant);
  url.pathname = `/detail/${id}${tail.length ? `/${tail.join("/")}` : ""}`;

  const res = NextResponse.rewrite(url);
  if (!req.cookies.get("detailVariant")) {
    res.cookies.set("detailVariant", variant, {
      path: "/detail",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
