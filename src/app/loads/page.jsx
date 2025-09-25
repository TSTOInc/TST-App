import { Suspense } from "react";
import TablePage from "./loadsPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <TablePage />
    </Suspense>
  );
}
