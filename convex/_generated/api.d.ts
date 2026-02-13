/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as broker_agents from "../broker_agents.js";
import type * as brokers from "../brokers.js";
import type * as chats from "../chats.js";
import type * as cleanup from "../cleanup.js";
import type * as delete_ from "../delete.js";
import type * as drivers from "../drivers.js";
import type * as encryption from "../encryption.js";
import type * as equipment from "../equipment.js";
import type * as files from "../files.js";
import type * as getDoc from "../getDoc.js";
import type * as getTable from "../getTable.js";
import type * as http from "../http.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as loads from "../loads.js";
import type * as logs from "../logs.js";
import type * as messages from "../messages.js";
import type * as mutate from "../mutate.js";
import type * as organizations from "../organizations.js";
import type * as payment_terms from "../payment_terms.js";
import type * as truck_inspections from "../truck_inspections.js";
import type * as trucks from "../trucks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  broker_agents: typeof broker_agents;
  brokers: typeof brokers;
  chats: typeof chats;
  cleanup: typeof cleanup;
  delete: typeof delete_;
  drivers: typeof drivers;
  encryption: typeof encryption;
  equipment: typeof equipment;
  files: typeof files;
  getDoc: typeof getDoc;
  getTable: typeof getTable;
  http: typeof http;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  loads: typeof loads;
  logs: typeof logs;
  messages: typeof messages;
  mutate: typeof mutate;
  organizations: typeof organizations;
  payment_terms: typeof payment_terms;
  truck_inspections: typeof truck_inspections;
  trucks: typeof trucks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
