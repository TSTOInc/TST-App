import { Suspense } from "react";
import ExampleUsage from "./ExampleUsage"; // Import the client component

export default function Page() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <ExampleUsage />
    </Suspense>
  );
}
