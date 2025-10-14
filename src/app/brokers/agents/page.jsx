import InfoGrid from "@/components/data/info-grid";

const agentSchema = {
  title: "name", // simple key
  description: ["email", " • ", "phone"], // multiple fields combined
  image: "image_url", // single key
  status: "status",
};


export default function Page() {
  return (
    <InfoGrid
      table="brokers_agents"
      schema={agentSchema}
      fields={["title", "description", "status"]}
    />
  );
}
