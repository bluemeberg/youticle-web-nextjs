import { Suspense } from "react";
import Select from "./components/Select";

export default async function Subjectpage() {
  // 데이터를 클라이언트 컴포넌트에 전달
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <Select />
    </Suspense>
  );
}
