import InfoGrid from "@/components/data/info-grid";

const driverSchema = {
  title: "name", // simple key
  description: ["License-", "license_number", " • ", "phone"], // multiple fields combined
  image: "image_url", // single key
  status: "status",
};

export default function Page() {
  return (
    <InfoGrid
      table="drivers"
      schema={driverSchema}
      fields={["title", "description", "status"]}
    />
  );
}
