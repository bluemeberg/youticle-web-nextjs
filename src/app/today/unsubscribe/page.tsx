// today/unsubscribe/page.tsx

"use client";

import React from "react";
import { useRouter } from "next/navigation";

const UnsubscribePage = () => {
  const router = useRouter();

  const handleUnsubscribe = () => {
    // 구독 해지 로직 처리
    alert("You have unsubscribed.");
    router.push("/today"); // 해지 후 리다이렉트
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Unsubscribe from Topics</h1>
      <p>Are you sure you want to unsubscribe from all topics?</p>
      <button
        onClick={handleUnsubscribe}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007BFF",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Unsubscribe
      </button>
    </div>
  );
};

export default UnsubscribePage;
