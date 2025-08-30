// FieldRenderer.tsx
import React from "react";
import ComboBox, { ComboBoxOption } from "./ComboBox";
import DocUpload from "./DocUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


type Field = {
  key: string;
  value: any;
  type?: "text" | "number" | "status" | "file";
  options?: ComboBoxOption[]; // for status/combo
};

type FieldRendererProps = {
  field: Field;
  onChange: (key: string, value: any) => void;
};

export default function FieldRenderer({ field, onChange }: FieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key} className="capitalize">
        {field.key.replace(/_/g, " ")}
      </Label>

      {field.type === "status" && field.options ? (
        <ComboBox
          className="z-80"
          showBadges
          options={field.options}
          defaultValue={field.options.find((o) => o.value === field.value)}
          onSelect={(selected) => onChange(field.key, selected.value)}
        />
      ) : field.type === "file" ? (
        <DocUpload
          onChange={(file: File) => onChange(field.key, file)}
        />
      ) : (
        <Input
          id={field.key}
          name={field.key}
          defaultValue={field.value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
    </div>
  );
}
