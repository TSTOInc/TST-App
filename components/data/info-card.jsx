import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Copy from "@/components/copy"
import LinkButton from "@/components/link"
import formatPhoneNumber from "@/utils/formatPhone"
import SearchableSelect from "@/components/comp-229"
import { PencilIcon } from "lucide-react"

function formatTimestamp(ms) {
  const date = new Date(Math.floor(ms));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: true      
  }).format(date);
}

// Updated Field Component: Swapped native select for your SearchableSelect
const Field = ({ label, value, type, inline, href, blank, external, isEditing, onChange, options = [] }) => {
  const link = href ?? value;
  const isEmpty = value === null || value === undefined;
  let displayValue = "N/A";

  // Normalize options shape for SearchableSelect (maps 'id' to 'value')
  const searchableOptions = options.map(opt => ({
    value: opt.id,
    label: opt.label,
    description: opt.description
  }));

  if (!isEmpty) {
    if (type === "date") {
      displayValue = formatTimestamp(value);
    } else if (type === "phone") {
      displayValue = formatPhoneNumber(value);
    } else if (type === "reference") {
      const matchedOption = searchableOptions.find(opt => opt.value === value);
      displayValue = matchedOption ? matchedOption.label : String(value);
    } else {
      displayValue = String(value);
    }
  }

  // Edit Mode view
  if (isEditing) {
    return (
      <div className={`flex ${inline ? "items-center gap-2" : "flex-col"} mb-4 w-full`}>
        {inline && <p className="text-muted-foreground text-sm font-medium min-w-[100px]">{label}:</p>}
        
        {type === "reference" ? (
          <SearchableSelect
            label={inline ? undefined : label} // Don't duplicate labels if inline layout handles it
            placeholder={`Select ${label.toLowerCase()}...`}
            options={searchableOptions}
            value={value ?? ""}
            onChange={onChange}
            className="w-full max-w-xs"
          />
        ) : (
          <>
            {!inline && <p className="text-muted-foreground text-sm font-medium mb-1">{label}:</p>}
            <input
              type="text"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              className="flex h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </>
        )}
      </div>
    );
  }

  // Read-only standard view
  const content = (
    <div className="flex items-center gap-1">
      <p>{displayValue}</p>
      {!isEmpty && type !== "link" && <Copy value={value} />}
      {type === "link" && link && (
        <LinkButton href={link} blank={blank} external={external} />
      )}
    </div>
  );

  return inline ? (
    <div className="flex items-center gap-2 mb-4">
      <p className="text-muted-foreground">{label}:</p>
      {content}
    </div>
  ) : (
    <div className="flex flex-col mb-4">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      {content}
    </div>
  );
};

export default function InfoCard({ CardIcon, title, fields, inline = true, editable }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState({});
  const mutateFields = useMutation(api.generic.updateGenericFields);

  // 1. Build a map to hold option datasets dynamically for each distinct lookup table configuration
  const lookupOptionsMap = {};

  // Find all distinct tables mentioned in fields layout
  const requiredTables = Array.from(
    new Set(
      fields
        .filter(f => f.type === "reference" && f.referenceTable)
        .map(f => f.referenceTable)
    )
  );

  // 2. Load the dynamic universal search data hooks
  requiredTables.forEach((tableName) => {
    const data = useQuery(api.lookups.getOptions, { referenceTable: tableName }) || [];
    lookupOptionsMap[tableName] = data;
  });

  const handleStartEditing = () => {
    const initialState = {};
    fields.forEach((field) => {
      if (field.key) {
        initialState[field.key] = field.value;
      }
    });
    setEditState(initialState);
    setIsEditing(true);
  };

  const handleFieldChange = (key, newValue) => {
    setEditState((prev) => ({ ...prev, [key]: newValue }));
  };

  const handleSave = async () => {
    if (!editable?.tableName || !editable?.id) return;
    try {
      await mutateFields({
        tableName: editable.tableName,
        id: editable.id,
        fields: editState,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to batch update card fields:", err);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex flex-row items-center gap-2">{CardIcon}{title}</CardTitle>
        {editable && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </>
            ) : (
              <Button size="icon" variant="outline" className="p-4" onClick={handleStartEditing}>
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="ml-4 space-y-2">
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-x-6 gap-y-1">
          {fields.map((field, i) => {
            const optionsList = field.type === "reference" ? (lookupOptionsMap[field.referenceTable] || []) : [];

            return (
              <Field
                key={i}
                label={field.label}
                value={isEditing && field.key ? editState[field.key] : field.value}
                type={field.type || "text"}
                href={field.href} 
                blank={field.blank ?? true}
                external={field.external ?? true}
                inline={inline}
                isEditing={isEditing && !!field.key} 
                onChange={(newValue) => handleFieldChange(field.key, newValue)}
                options={optionsList}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}