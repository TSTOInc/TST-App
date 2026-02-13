import { Organization } from "@clerk/backend";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    clerk_id: v.string(),
    email: v.string(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    image_url: v.optional(v.string()),
    username: v.optional(v.string()),
  }).index("by_email", ["email"]).index("by_clerkId", ["clerk_id"]),

  //
  memberships: defineTable({
    user_id: v.id("users"),
    org_id: v.id("organizations"),
    role: v.string(),
  }).index("by_user_org", ["user_id", "org_id"]).index("by_userId", ["user_id"]).index("by_orgId", ["org_id"]),


  organizations: defineTable({
    clerk_org_id: v.string(), // link to Clerk
    name: v.string(),

    // Carrier business info
    usdot: v.optional(v.string()),
    mc_number: v.optional(v.string()),
    years_in_operation: v.optional(v.number()),
    company_email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),

    // SaaS logic
    subscription_status: v.optional(v.string()),
    plan: v.optional(v.string()),

  }).index("by_clerkOrgId", ["clerk_org_id"]),


  brokers: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.string(),
    address: v.string(),
    address_2: v.union(v.null(), v.string()),
    docket_number: v.string(),
    email: v.union(v.null(), v.string()),
    image_url: v.union(v.null(), v.string()),
    name: v.string(),
    notes: v.union(v.null(), v.string()),
    phone: v.union(v.null(), v.string()),
    status: v.string(),
    usdot_number: v.string(),
    website: v.union(v.null(), v.string()),
  }).index("by_orgId", ["org_id"]),

  brokers_agents: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.string(),
    broker_id: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    phone: v.optional(v.string()),
    position: v.optional(v.string()),
  }).index("by_orgId", ["org_id"]).index("by_brokerId", ["broker_id"]),

  chats: defineTable({
    lastMessageId: v.optional(v.id("messages")),
    type: v.string(),
    org_id: v.id("organizations"),
  }).index("by_orgId", ["org_id"]),

  chatParticipants: defineTable({
    chatId: v.id("chats"),
    userId: v.id("users"),
  }).index("by_userId", ["userId"])
    .index("by_chatId", ["chatId"])
    .index("by_user_chat", ["userId", "chatId"]),



  drivers: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.id("organizations"),
    email: v.optional(v.string()),
    image_url: v.optional(v.string()),
    license_number: v.optional(v.string()),
    name: v.string(),
    phone: v.string(),
    status: v.string(),
    userId: v.optional(v.id("users")),
  }).index("by_orgId", ["org_id"]),

  equipment: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.string(),
    equipment_length: v.union(v.null(), v.string()),
    equipment_number: v.string(),
    equipment_type: v.string(),
    image_url: v.union(v.null(), v.string()),
    status: v.string(),
  }).index("by_orgId", ["org_id"]),

  counters: defineTable({
    org_id: v.string(),
    last_number: v.number(),
  }).index("by_org", ["org_id"]),

  loads: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.string(),
    agent_id: v.optional(v.string()),
    broker_id: v.string(),
    commodity: v.string(),
    docs: v.array(v.string()),
    equipment_id: v.optional(v.string()),
    instructions: v.union(v.null(), v.string()),
    invoice_number: v.string(),
    invoiced_at: v.optional(v.string()),
    length_ft: v.float64(),
    load_number: v.string(),
    load_status: v.string(),
    load_type: v.string(),
    paid_at: v.union(v.null(), v.string()),
    payment_terms_id: v.string(),
    progress: v.float64(),
    rate: v.number(),
    truck_id: v.string(),
    drivers: v.optional(v.array(v.string())),
  }).index("by_brokerId", ["broker_id"]).index("by_orgId", ["org_id"]),

  messages: defineTable({
    chatId: v.id("chats"),
    deliveredTo: v.array(v.id("users")),
    seenBy: v.array(v.id("users")),
    senderId: v.id("users"),
    text: v.string(),
  }),

  payment_terms: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.string(),
    broker_id: v.string(),
    days_to_pay: v.float64(),
    email: v.union(v.null(), v.string()),
    fee_percent: v.number(),
    is_quickpay: v.boolean(),
    name: v.string(),
  }).index("by_orgId", ["org_id"]).index("by_brokerId", ["broker_id"]),

  stops: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.string(),
    appointment_time: v.union(v.null(), v.string()),
    load_id: v.string(),
    location: v.string(),
    time_type: v.string(),
    type: v.string(),
    window_end: v.union(v.null(), v.string()),
    window_start: v.union(v.null(), v.string()),
  }).index("by_orgId", ["org_id"]).index("by_loadId", ["load_id"]),

  truck_inspections: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.string(),
    inspection_date: v.string(),
    inspection_type: v.string(),
    notes: v.null(),
    result: v.string(),
    truck_id: v.string(),
  }).index("by_orgId", ["org_id"]),

  trucks: defineTable({
    created_by: v.optional(v.id("users")),
    org_id: v.id("organizations"),
    color: v.optional(v.string()),
    driver_id: v.optional(v.id("drivers")),
    image_url: v.string(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    status: v.string(),
    transponder_id: v.optional(v.string()),
    truck_alias: v.optional(v.string()),
    truck_number: v.string(),
    vin: v.optional(v.string()),
    year: v.optional(v.float64()),
  }).index("by_orgId", ["org_id"]),

  files: defineTable({
    storageKey: v.string(), // blob key / object key
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),

    category: v.union(
      v.literal("CDL"),
      v.literal("BOL"),
      v.literal("POD"),
      v.literal("RATE_CONFIRMATION"),
      v.literal("INNOUT_TICKET"),
      v.literal("LUMPER"),
      v.literal("SCALE_TICKET"),
      v.literal("TRAILER_INTERCHANGE"),
      v.literal("CARRIER_AGREEMENT"),
      v.literal("QUICKPAY_AGREEMENT"),
      v.literal("REGISTRATION"),
      v.literal("ID_CARD"),
      v.literal("MISC"),
    ),

    uploadedBy: v.id("users"),
    entityType: v.union(
      v.literal("drivers"),
      v.literal("loads"),
      v.literal("brokers"),
      v.literal("trucks"),
      v.literal("equipment"),
    ),
    entityId: v.string(),
    expiresAt: v.optional(v.number()),
    org_id: v.string(),

    status: v.union(
      v.literal("uploading"),
      v.literal("ready"),
      v.literal("failed"),
      v.literal("deleted")
    ),


  }).index("by_status", ["status"]).index("by_orgId", ["org_id", "status"]).index("by_entity", ["entityType", "entityId", "org_id", "status"]),


  audit_logs: defineTable({
    table: v.string(),            // "loads", "invoices", etc.
    record_id: v.string(),        // generic id (toString())
    action: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete")
    ),
    performed_by: v.string(),     // Clerk userId
    org_id: v.optional(v.string()),

    before: v.optional(v.any()),
    after: v.optional(v.any()),

    changed_fields: v.optional(v.array(v.string())),
    comment: v.optional(v.string()),

    created_at: v.number(),
  })
    .index("by_record_org", ["table", "record_id", "org_id"])
    .index("by_orgId", ["org_id"]),







});


