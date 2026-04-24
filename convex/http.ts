/**
 * AutomatedWorlds — Convex HTTP Router
 * Registers all webhook endpoints.
 */

import { httpRouter } from "convex/server";
import { polarWebhook } from "./polarwebhook";

const http = httpRouter();

// Polar payment events
http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: polarWebhook,
});

export default http;