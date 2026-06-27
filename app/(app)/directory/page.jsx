import { Suspense } from "react";
import DirectoryClient from "./DirectoryClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <DirectoryClient />
    </Suspense>
  );
}
