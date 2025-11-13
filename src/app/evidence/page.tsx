import { Suspense } from "react";
import EvidencePageClient from "@/components/evidence/EvidencePageClient";

export default function EvidencePage() {
  return (
    <Suspense fallback={null}>
      <EvidencePageClient />
    </Suspense>
  );
}
