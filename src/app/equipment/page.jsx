import InfoGrid from "@/components/data/info-grid";

const equipmentSchema = {
  title: "equipment_number",
  description: ["equipment_type"],
  image: "image_url",
  status: "status",
};


export default function Page() {
  return (
    <InfoGrid
      table="equipment"
      schema={equipmentSchema}
      fields={["title", "description", "status"]}
    />
  );
}

