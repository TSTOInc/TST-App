"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Check, X, Pencil, Building2, Contact2, ShieldAlert } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

export default function HomePage() {
  const { organization: clerkOrg, isLoaded } = useOrganization();

  // Convex Query & Mutation
  const userWithOrg = useQuery(api.auth.getUserWithOrg);
  const orgData = userWithOrg?.org;
  const updateOrg = useMutation(api.organizations.update);

  // Tracks which field is currently being edited (e.g., "name", "usdot")
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  if (!isLoaded) return <div className="px-8 py-7 text-sm text-muted-foreground animate-pulse">Loading authorization...</div>;
  if (!clerkOrg) return <div className="px-8 py-7 text-sm text-destructive">Please select an organization in Clerk.</div>;
  if (orgData === undefined) return <div className="px-8 py-7 text-sm text-muted-foreground animate-pulse">Loading details...</div>;
  if (orgData === null) return <div className="px-8 py-7 text-sm text-destructive">No matching organization found.</div>;

  const startEditing = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName);
    setEditValue(currentValue?.toString() || "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = async (fieldName: string) => {
    try {
      let formattedValue: any = editValue;
      
      // Coerce numeric types for Convex schema safety
      if (fieldName === "years_in_operation" || fieldName === "ein") {
        formattedValue = editValue ? Number(editValue) : undefined;
      } else if (editValue === "") {
        formattedValue = undefined;
      }

      await updateOrg({
        id: orgData._id,
        name: fieldName === "name" ? (editValue || orgData.name) : orgData.name,
        // Spread existing data and dynamically overwrite the edited field
        ...{
          usdot: orgData.usdot,
          docket_number: orgData.docket_number,
          years_in_operation: orgData.years_in_operation,
          ein: orgData.ein,
          address: orgData.address,
          city: orgData.city,
          state: orgData.state,
          zip: orgData.zip,
          company_email: orgData.company_email,
          phone: orgData.phone,
          [fieldName]: formattedValue
        }
      });
      setEditingField(null);
    } catch (error) {
      console.error(`Failed to update ${fieldName}:`, error);
    }
  };

  // Helper component for rendering clean editable rows
  const EditableRow = ({ label, field, value, type = "text" }: { label: string; field: string; value: any; type?: string }) => {
    const isCurrent = editingField === field;

    return (
      <div className="group flex items-center justify-between min-h-[44px] py-1 px-3 -mx-3 rounded-lg transition-all duration-200 hover:bg-muted/50 border border-transparent hover:border-border/40">
        <span className="text-[13px] font-medium text-muted-foreground/90">{label}</span>
        
        <div className="flex items-center gap-2 max-w-[65%] text-right">
          {isCurrent ? (
            <div className="flex items-center gap-1.5 dynamic-fade-in">
              <Input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 py-1 px-2 text-sm max-w-[180px] bg-background shadow-sm focus-visible:ring-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveField(field);
                  if (e.key === 'Escape') cancelEditing();
                }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30" onClick={() => saveField(field)}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={cancelEditing}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight text-foreground/90 truncate max-w-[240px]">
                {value ?? <span className="text-muted-foreground/40 italic font-normal">Not provided</span>}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground/50 hover:text-foreground transition-colors duration-150"
                onClick={() => startEditing(field, value)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-8 py-7">
      <div className="flex flex-col items-stretch justify-start gap-4 box-border">
        
        {/* Heading Section */}
        <div className="flex items-center gap-3 border-b border-border pb-3">
          {orgData.image_url && (
            <img src={orgData.image_url} alt="" className="w-12 h-12 rounded-md object-cover border bg-muted" />
          )}
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight">{orgData.name}</h1>
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase mt-0.5">Workspace Profile</p>
          </div>
        </div>

        {/* Dynamic, clean columns dashboard details container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-2">
          
          {/* Column 1: Carrier Authority */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <Building2 className="w-4 h-4 text-muted-foreground/70" />
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Carrier Authority</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <EditableRow label="USDOT Number" field="usdot" value={orgData.usdot} />
              <EditableRow label="Docket Number" field="docket_number" value={orgData.docket_number} />
              <EditableRow label="EIN / Tax ID" field="ein" value={orgData.ein} type="number" />
              <EditableRow label="Years in Operation" field="years_in_operation" value={orgData.years_in_operation} type="number" />
            </div>
          </div>

          {/* Column 2: Contact & Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <Contact2 className="w-4 h-4 text-muted-foreground/70" />
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Contact & Operations</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <EditableRow label="Contact Email" field="company_email" value={orgData.company_email} type="email" />
              <EditableRow label="Contact Phone" field="phone" value={orgData.phone} type="tel" />
              <EditableRow label="Street Address" field="address" value={orgData.address} />
              <EditableRow label="City" field="city" value={orgData.city} />
              <EditableRow label="State" field="state" value={orgData.state} />
              <EditableRow label="Zip Code" field="zip" value={orgData.zip} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}