"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ListVisibilityToggle({
  id,
  initialPublic,
}: {
  id: number;
  initialPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    setPending(true);
    const next = !isPublic;

    try {
      const response = await fetch("/api/list-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_public: next }),
      });

      if (!response.ok) return;
      setIsPublic(next);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={toggle}
      className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
    >
      {pending ? "در حال ذخیره..." : isPublic ? "عمومی" : "خصوصی"}
    </Button>
  );
}
