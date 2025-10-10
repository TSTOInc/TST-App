import InfoGridUI from "./info-grid-client"; // client component
import { getTable } from "@/lib/fetch";
export const dynamic = "force-dynamic"; // ensure fresh fetches

// Helper: safely get nested values (like "truck.details.year")
function getValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

// Helper: normalize schema field value
function resolveSchemaField(schemaField, item, key) {
  if (typeof schemaField === "function") {
    return schemaField(item);
  }

  // For images, never treat literals as text — always assume it's a field path
  const isImageField = key === "image";

  if (Array.isArray(schemaField)) {
    return schemaField
      .map(part => {
        if (isImageField) return getValue(item, part); // skip literal mode for image
        const val = getValue(item, part);
        return val !== undefined && val !== null ? val : part; // static text support
      })
      .join(isImageField ? "" : "");
  }

  if (typeof schemaField === "string") {
    const val = getValue(item, schemaField);
    // Only fallback to literal for non-image fields
    return val ?? (isImageField ? "" : schemaField);
  }

  return "";
}

export default async function InfoGrid({ table, skeleton, fields = [], schema }) {
  let rawData = [];
  if (!skeleton) {
    rawData = await getTable(table);
  }

  // Map raw data to schema fields
  const data = rawData.map(item => ({
    id: item.id,
    title: resolveSchemaField(schema.title, item, "title"),
    description: resolveSchemaField(schema.description, item, "description"),
    image: resolveSchemaField(schema.image, item, "image"),
    status: resolveSchemaField(schema.status, item, "status"),
    website: schema.website ? resolveSchemaField(schema.website, item, "website") : "",
  }));


  return <InfoGridUI table={table} data={data} skeleton={skeleton} fields={fields} />;
}
