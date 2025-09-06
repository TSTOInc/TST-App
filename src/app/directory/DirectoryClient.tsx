"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import Loading from "@/components/custom/Loading";

export default function DirectoryClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
    setReady(true);

    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (q: string = query) => {
    if (!q) {
      setResults([]);
      router.replace("/directory");
      return;
    }

    setHasSearched(true);
    setLoading(true);
    setError(null);
    router.replace(`/directory?q=${encodeURIComponent(q)}`);

    try {
      const res = await fetch(
        `https://tst.api.incashy.com/fmcsa/get?type=name&q=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResults(data.carriers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  if (!ready) return <Loading />;

  return (
    <main className="p-4">
      <div className="mx-auto flex w-full items-center mb-6 max-w-xl">
        <Input
          type="text"
          placeholder="Search carriers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="rounded-l-full rounded-r-none"
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-r-full rounded-l-none"
          onClick={() => handleSearch()}
        >
          <IconSearch />
        </Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="flex-grow flex flex-col justify-center">
        {!hasSearched && results.length === 0 && (
          <div>
            Search for any <b>carriers</b> or <b>brokers</b> by name
          </div>
        )}

        {hasSearched && query && results.length > 0 && (
          <div>Showing {results.length} results for "{query}"</div>
        )}

        {hasSearched && query && results.length === 0 && (
          <div className="flex items-center justify-center h-[70vh]">
            {loading && <Loading />}
            {!loading && (
              <div className="flex flex-col justify-center items-center text-center p-8">
                <h1 className="text-6xl lg:text-8xl font-bold mb-4">404</h1>
                <p className="text-xl mb-8">No results found...</p>
              </div>
            )}
          </div>
        )}

        {!loading &&
          results.length > 0 &&
          results.map((carrier: any) => (
            <Card key={carrier.dotNumber} className="border-none p-4 bg-transparent">
              <CardContent>
                <CardTitle>
                  <Link
                    href={`/directory/${carrier.dotNumber}`}
                    className="underline text-xl"
                  >
                    {carrier.legalName}
                  </Link>
                </CardTitle>
                <p className="mt-1">
                  {carrier.phyStreet}, {carrier.phyCity}, {carrier.phyState}{" "}
                  {carrier.phyZipcode}
                </p>
                <span className="border rounded-lg p-2 mt-1 inline-block text-sm">
                  USDOT: {carrier.dotNumber}
                </span>
              </CardContent>
            </Card>
          ))}
      </div>
    </main>
  );
}
