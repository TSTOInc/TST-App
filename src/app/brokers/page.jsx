import InfoGrid from "@/components/data/info-grid";

const brokerSchema = {
  title: "name",
  description: ["DOT-","usdot_number"," • ","docket_number"],
  image: "image_url",
  status: "status",
  website: "website",
};
export default function Page() {
  return (
    <InfoGrid
      table="brokers"
      schema={brokerSchema}
      fields={["title", "description", "status"]}
    />
  );
}
