import { Suspense } from "react";
import KeywordMigrationView from "./KeywordMigrationView";

export default function KeywordMigrationPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <KeywordMigrationView />
    </Suspense>
  );
}
