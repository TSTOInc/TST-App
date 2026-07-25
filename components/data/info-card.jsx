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
import { toast } from "sonner"

function formatTimestamp(ms) {
  const date = new Date(Math.floor(ms));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: true      
  }).format(date);
}

/**
 * Normalizes options into { value, label, description } for SearchableSelect
 */
function normalizeOptions(options = []) {
  return options.map(opt => {
    if (typeof opt === "string" || typeof opt === "number") {
      return { value: String(opt), label: String(opt) };
    }
    return {
      value: opt.id ?? opt.value,
      label: opt.label ?? opt.name ?? String(opt.id ?? opt.value),
      description: opt.description,
    };
  });
}

/**
 * Sub-component for reference fields to safely call React hooks at top-level
 */
const ReferenceFieldContent = ({ referenceTable, options: staticOptions, value, ...props }) => {
  // Call useQuery top-level (only conditionally skips execution if referenceTable is missing)
  const dynamicOptions = useQuery(
    api.lookups.getOptions,
    referenceTable ? { referenceTable } : "skip"
  ) || [];

  const rawOptions = referenceTable ? dynamicOptions : staticOptions;
  const searchableOptions = normalizeOptions(rawOptions);

  return <FieldRenderer searchableOptions={searchableOptions} value={value} {...props} />;
};

const FieldRenderer = ({ 
  label, value, type, inline, href, blank, external = false, 
  isEditing, onChange, searchableOptions = [] 
}) => {
  const link = href && value ? href : null;
  const isEmpty = value === null || value === undefined;
  let displayValue = "No " + label + " found";

  if (!isEmpty) {
    if (type === "date") {
      displayValue = formatTimestamp(value);
    } else if (type === "phone") {
      displayValue = formatPhoneNumber(value);
    } else if (type === "reference" || type === "select") {
      const matchedOption = searchableOptions.find(opt => String(opt.value) === String(value));
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
        
        {type === "reference" || type === "select" ? (
          <SearchableSelect
            label={inline ? undefined : label}
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
      {!isEmpty && type !== "reference" && type !== "select" && <Copy value={value} />}
      {!isEmpty && (type === "reference" || type === "select") && link && (
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

// Dispatcher field component
const Field = (props) => {
  if (props.type === "reference" || props.type === "select") {
    return <ReferenceFieldContent {...props} />;
  }
  return <FieldRenderer {...props} />;
};

export default function InfoCard({ CardIcon, title, fields, inline = true, editable }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState({});
  const mutateFields = useMutation(api.generic.updateGenericFields);

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

    const changedFields = {};
    fields.forEach((field) => {
      if (field.key && editState[field.key] !== field.value) {
        changedFields[field.key] = editState[field.key];
      }
    });

    if (Object.keys(changedFields).length === 0) {
      toast.info("No changes to save");
      setIsEditing(false);
      return;
    }

    toast.promise(
      mutateFields({
        tableName: editable.tableName,
        id: editable.id,
        fields: changedFields,
      }),
      {
        loading: "Saving changes...",
        success: () => {
          setIsEditing(false);
          return "Changes saved successfully";
        },
        error: (err) => {
          console.error("Failed to batch update card fields:", err);
          return "Failed to save changes";
        },
      }
    );
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
          {fields.map((field, i) => (
            <Field
              key={field.key || i}
              label={field.label}
              value={isEditing && field.key ? editState[field.key] : field.value}
              type={field.type || "text"}
              href={field.href} 
              blank={field.blank ?? true}
              external={field.external ?? true}
              inline={inline}
              isEditing={isEditing && !!field.key} 
              onChange={(newValue) => handleFieldChange(field.key, newValue)}
              referenceTable={field.referenceTable}
              options={field.options}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}