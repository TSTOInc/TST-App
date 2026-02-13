// convex/lib/audit.ts
import { Id } from "../_generated/dataModel";

type AuditArgs = {
  table: string;
  recordId: Id<any>;
  action: "create" | "update" | "delete";
  userId: string;
  org_id: string;
  before?: any;
  after?: any;
};

export async function logAudit(ctx: any, args: AuditArgs) {
  let changedFields: string[] | undefined;
  let filteredBefore: Record<string, any> | undefined;
  let filteredAfter: Record<string, any> | undefined;

  if (args.before && args.after) {
    changedFields = Object.keys(args.after).filter(
      (key) =>
        JSON.stringify(args.before?.[key]) !==
        JSON.stringify(args.after?.[key])
    );

    // If nothing changed, don't log
    if (changedFields.length === 0) return;

    // Keep only changed fields
    filteredBefore = {};
    filteredAfter = {};

    for (const key of changedFields) {
      filteredBefore[key] = args.before[key];
      filteredAfter[key] = args.after[key];
    }
  }

  await ctx.db.insert("audit_logs", {
    table: args.table,
    record_id: args.recordId.toString(),
    action: args.action,
    performed_by: args.userId,
    org_id: args.org_id,
    before:
      args.action === "delete"
        ? args.before
        : args.action === "update"
        ? filteredBefore
        : undefined,
    after:
      args.action === "create"
        ? args.after
        : args.action === "update"
        ? filteredAfter
        : undefined,
    changed_fields: changedFields,
    created_at: Date.now(),
  });
}

