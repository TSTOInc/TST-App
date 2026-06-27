import InfoGrid from "@/components/data/info-grid";

const truckSchema = {
  title: "truck_number",
  description: ["make", "model", "year"],
  image: "image_url",
  status: "status",
};
export default function Page() {
  return (
    <InfoGrid
      table="trucks"
      schema={truckSchema}
      fields={["title", "description", "status"]}
    />
  );
}
