"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/custom/Loading";

export default function DirectoryClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setReady(true);
  }, [searchParams]);

  if (!ready) return <Loading />;

  return (
    <main className="p-4">
      <div className="flex items-center mb-6">
        <Input
          type="text"
          value={query}
          placeholder="Search carriers..."
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          onClick={() =>
            router.replace(`/directory?q=${encodeURIComponent(query)}`)
          }
        >
          Search
        </Button>
      </div>
    </main>
  );
}
