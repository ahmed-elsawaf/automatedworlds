/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as categories from "../categories.js";
import type * as codeAssets from "../codeAssets.js";
import type * as customizations from "../customizations.js";
import type * as discounts from "../discounts.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as ideas from "../ideas.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as polarwebhook from "../polarwebhook.js";
import type * as reviews from "../reviews.js";
import type * as seed_v3 from "../seed_v3.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  categories: typeof categories;
  codeAssets: typeof codeAssets;
  customizations: typeof customizations;
  discounts: typeof discounts;
  helpers: typeof helpers;
  http: typeof http;
  ideas: typeof ideas;
  notifications: typeof notifications;
  orders: typeof orders;
  polarwebhook: typeof polarwebhook;
  reviews: typeof reviews;
  seed_v3: typeof seed_v3;
  storage: typeof storage;
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
