/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as brokers from "../brokers.js";
import type * as chats from "../chats.js";
import type * as delete_ from "../delete.js";
import type * as encryption from "../encryption.js";
import type * as equipment from "../equipment.js";
import type * as getDoc from "../getDoc.js";
import type * as getTable from "../getTable.js";
import type * as http from "../http.js";
import type * as loads from "../loads.js";
import type * as messages from "../messages.js";
import type * as mutate from "../mutate.js";
import type * as payment_terms from "../payment_terms.js";
import type * as truck_inspections from "../truck_inspections.js";
import type * as trucks from "../trucks.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  brokers: typeof brokers;
  chats: typeof chats;
  delete: typeof delete_;
  encryption: typeof encryption;
  equipment: typeof equipment;
  getDoc: typeof getDoc;
  getTable: typeof getTable;
  http: typeof http;
  loads: typeof loads;
  messages: typeof messages;
  mutate: typeof mutate;
  payment_terms: typeof payment_terms;
  truck_inspections: typeof truck_inspections;
  trucks: typeof trucks;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
