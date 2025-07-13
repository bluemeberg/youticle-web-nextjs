// middleware.ts (프로젝트 루트)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/detail/:path*"], // detail 하위 모든 경로에 적용
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // 이미 A/B variant 쪽으로 들어온 요청이면 패스
  if (pathname.startsWith("/detail/a/") || pathname.startsWith("/detail/b/")) {
    return NextResponse.next();
  }

  // URL 에서 id 와 나머지 경로 확보
  const [, , ...rest] = pathname.split("/"); // ['', 'detail', id, ...subPaths]
  const id = rest[0];
  const tail = rest.slice(1).join("/"); // 예: 'comments' 등 추가 서브경로가 있으면 붙여줌

  // 쿠키에서 variant 조회, 없으면 50:50 랜덤
  let variant = req.cookies.get("detailVariant")?.value;
  if (!variant) {
    variant = Math.random() < 0.5 ? "b" : "b";
  }
  // variant = Math.random() < 0.5 ? "b" : "b";

  // 리라이팅할 내부 경로 생성
  let newPath = `/detail/${variant}/${id}`;
  if (tail) newPath += `/${tail}`;

  url.pathname = newPath;
  const res = NextResponse.rewrite(url);

  // 최초 분기 시에만 쿠키 저장 (30일 유지)
  if (!req.cookies.get("detailVariant")) {
    res.cookies.set("detailVariant", variant, {
      path: "/detail",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}
