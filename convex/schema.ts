import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────────────────────
// AutomatedWorlds — Convex Schema
// Stack: Next.js · Convex · Clerk · Polar
// ─────────────────────────────────────────────────────────────────────────────

export default defineSchema({
  // ───────────────────────────────────────────────────────────────────────────
  // USERS
  // Synchronized from Clerk session via storeUser mutation.
  // ───────────────────────────────────────────────────────────────────────────
  users: defineTable({
    // Clerk
    clerkId:        v.string(),
    email:          v.string(),
    name:           v.optional(v.string()),
    avatarUrl:      v.optional(v.string()),

    // Role & access
    role:           v.union(v.literal("admin"), v.literal("member")),
    plan:           v.union(
                      v.literal("free"),
                      v.literal("starter"),
                      v.literal("pro"),
                      v.literal("enterprise")
                    ),

    // Polar
    polarCustomerId:        v.optional(v.string()),
    polarSubscriptionId:    v.optional(v.string()),
    polarSubscriptionStatus: v.optional(
                              v.union(
                                v.literal("active"),
                                v.literal("canceled"),
                                v.literal("past_due"),
                                v.literal("trialing"),
                                v.literal("unpaid")
                              )
                            ),
    planExpiresAt:  v.optional(v.number()),  // unix ms

    // Profile / preferences
    bio:            v.optional(v.string()),
    website:        v.optional(v.string()),
    company:        v.optional(v.string()),
    country:        v.optional(v.string()),
    timezone:       v.optional(v.string()),

    // Engagement stats (denormalized for quick display)
    totalPurchases: v.number(),          // ideas bought
    totalSpent:     v.number(),          // USD cents
    savedIdeas:     v.array(v.id("ideas")),

    // Metadata
    onboardingComplete: v.boolean(),
    createdAt:      v.number(),
    updatedAt:      v.number(),
  })
    .index("by_clerkId",          ["clerkId"])
    .index("by_email",            ["email"])
    .index("by_polarCustomerId",  ["polarCustomerId"])
    .index("by_plan",             ["plan"]),

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORIES
  // Top-level taxonomy for ideas (e.g. SaaS, AI Tool, Marketplace, etc.)
  // ───────────────────────────────────────────────────────────────────────────
  categories: defineTable({
    name:       v.string(),
    slug:       v.string(),
    description: v.optional(v.string()),
    icon:       v.optional(v.string()),   // emoji or icon key
    color:      v.optional(v.string()),   // hex color for UI badge
    sortOrder:  v.number(),
    isActive:   v.boolean(),
    createdAt:  v.number(),
  })
    .index("by_slug",      ["slug"])
    .index("by_sortOrder", ["sortOrder"]),

  // ───────────────────────────────────────────────────────────────────────────
  // TAGS
  // Fine-grained labels (e.g. "no-code", "B2B", "subscription", "solo-founder")
  // ───────────────────────────────────────────────────────────────────────────
  tags: defineTable({
    name:      v.string(),
    slug:      v.string(),
    color:     v.optional(v.string()),
    usageCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug",       ["slug"])
    .index("by_usageCount", ["usageCount"]),

  // ───────────────────────────────────────────────────────────────────────────
  // IDEAS
  // The core product. Each idea is a fully researched, ready-to-buy concept.
  // ───────────────────────────────────────────────────────────────────────────
  ideas: defineTable({
    // Identity
    title:       v.string(),
    slug:        v.string(),
    tagline:     v.string(),      // one-liner hook shown on cards
    description: v.string(),      // markdown — full pitch

    // Taxonomy
    categoryId:  v.id("categories"),
    tagIds:      v.array(v.id("tags")),

    // Status & visibility
    status: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("published"),
      v.literal("archived"),
      v.literal("sold_out")    // e.g. exclusive license fully claimed
    ),
    visibility: v.union(
      v.literal("public"),
      v.literal("members_only"),  // requires free account
      v.literal("paid_only")      // requires plan
    ),
    isFeatured:    v.boolean(),
    isNew:         v.boolean(),   // badge for first 14 days

    // ── Research & Validation ─────────────────────────────────────────────
    marketSize:    v.optional(v.string()),     // e.g. "$4.2B by 2027"
    targetAudience: v.string(),
    problemStatement: v.string(),
    solutionOverview: v.string(),
    uniqueValueProp: v.string(),

    competitors: v.array(v.object({
      name:       v.string(),
      url:        v.optional(v.string()),
      weakness:   v.string(),              // why our idea wins vs them
    })),

    revenueModel: v.string(),              // markdown — how it makes money
    revenueStreams: v.array(v.string()),   // e.g. ["Subscriptions","API usage"]

    goToMarket: v.optional(v.string()),    // markdown — GTM strategy
    growthStrategy: v.optional(v.string()),

    techStack: v.array(v.object({
      name:     v.string(),
      role:     v.string(),   // e.g. "Frontend", "Database", "Auth"
      url:      v.optional(v.string()),
    })),

    timeToLaunch:  v.optional(v.string()),  // e.g. "2–4 weeks"
    difficulty:    v.union(
                     v.literal("beginner"),
                     v.literal("intermediate"),
                     v.literal("advanced")
                   ),
    roiPotential:  v.union(
                     v.literal("low"),
                     v.literal("medium"),
                     v.literal("high"),
                     v.literal("very_high")
                   ),

    // ── Demo & Live Preview ───────────────────────────────────────────────
    demoUrl:       v.optional(v.string()),   // live demo the visitor can test
    demoUsername:  v.optional(v.string()),   // test credentials
    demoPassword:  v.optional(v.string()),
    videoUrl:      v.optional(v.string()),   // walkthrough video (Loom / YT)
    screenshotIds: v.array(v.id("_storage")), // Convex file storage
    coverImageId:  v.optional(v.id("_storage")),

    // ── Monetization / Pricing ────────────────────────────────────────────
    // Each idea can have multiple purchase options
    priceCodeBase:       v.optional(v.number()),  // USD cents — buy the code
    priceCustomization:  v.optional(v.number()),  // USD cents — starting price for custom work

    polarProductId:      v.optional(v.string()),  // code purchase product

    // ── Engagement Metrics (denormalized) ────────────────────────────────
    viewCount:     v.number(),
    saveCount:     v.number(),
    purchaseCount: v.number(),
    demoClickCount:v.optional(v.number()),
    rating:        v.optional(v.number()),   // 0–5, avg of reviews
    reviewCount:   v.number(),

    // ── SEO ───────────────────────────────────────────────────────────────
    metaTitle:       v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    ogImageId:       v.optional(v.id("_storage")),

    // Metadata
    authorId:    v.id("users"),    // admin/curator who created it
    publishedAt: v.optional(v.number()),
    createdAt:   v.number(),
    updatedAt:   v.number(),
  })
    .index("by_slug",        ["slug"])
    .index("by_status",      ["status"])
    .index("by_category",    ["categoryId"])
    .index("by_featured",    ["isFeatured"])
    .index("by_publishedAt", ["publishedAt"])
    .index("by_viewCount",   ["viewCount"])
    .index("by_purchaseCount", ["purchaseCount"])
    .searchIndex("search_ideas", {
      searchField: "title",
      filterFields: ["status", "categoryId", "difficulty", "roiPotential"],
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // IDEA_TAGS  (join table — ideas ↔ tags)
  // ───────────────────────────────────────────────────────────────────────────
  ideaTags: defineTable({
    ideaId: v.id("ideas"),
    tagId:  v.id("tags"),
  })
    .index("by_idea", ["ideaId"])
    .index("by_tag",  ["tagId"]),

  // ───────────────────────────────────────────────────────────────────────────
  // IDEA SECTIONS
  // Rich content blocks within an idea (ordered, type-safe, extensible).
  // Lets admins build the idea page like a CMS without fixed fields.
  // ───────────────────────────────────────────────────────────────────────────
  ideaSections: defineTable({
    ideaId:    v.id("ideas"),
    type: v.union(
      v.literal("markdown"),
      v.literal("feature_list"),
      v.literal("screenshot_gallery"),
      v.literal("metrics_grid"),
      v.literal("competitor_table"),
      v.literal("revenue_breakdown"),
      v.literal("faq"),
      v.literal("testimonial"),
      v.literal("cta_block"),
      v.literal("video_embed"),
      v.literal("tech_stack_grid"),
      v.literal("roadmap"),
      v.literal("checklist")
    ),
    title:     v.optional(v.string()),
    content:   v.string(),     // JSON-serialized section payload
    sortOrder: v.number(),
    isVisible: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_idea",      ["ideaId"])
    .index("by_idea_order",["ideaId", "sortOrder"]),

  // ───────────────────────────────────────────────────────────────────────────
  // ORDERS
  // Every completed purchase — code, exclusive license, or customization deposit.
  // Linked to Polar payment events via webhook.
  // ───────────────────────────────────────────────────────────────────────────
  orders: defineTable({
    userId:   v.id("users"),
    ideaId:   v.id("ideas"),

    type: v.union(
      v.literal("code_purchase"),       // buyer gets the source code
      v.literal("exclusive_license"),   // buyer gets full exclusivity
      v.literal("customization_deposit") // kick-off payment for custom work
    ),

    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("disputed"),
      v.literal("failed")
    ),

    // Financials
    amountTotal:  v.number(),   // USD cents
    amountTax:    v.number(),
    currency:     v.string(),   // "usd"

    // Polar
    polarOrderId:   v.string(),
    polarProductId: v.string(),
    polarCheckoutId: v.optional(v.string()),
    receiptUrl:     v.optional(v.string()),

    // Delivery
    codeDelivered:     v.boolean(),
    codeDeliveredAt:   v.optional(v.number()),
    downloadCount:     v.number(),
    maxDownloads:      v.number(),          // e.g. 5 — prevent abuse

    // Notes
    buyerNotes:   v.optional(v.string()),   // buyer left at checkout
    adminNotes:   v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user",          ["userId"])
    .index("by_idea",          ["ideaId"])
    .index("by_status",        ["status"])
    .index("by_polarOrderId",  ["polarOrderId"])
    .index("by_user_idea",     ["userId", "ideaId"]),

  // ───────────────────────────────────────────────────────────────────────────
  // ORDER DOWNLOADS
  // Tracks each time a buyer downloads the code file.
  // ───────────────────────────────────────────────────────────────────────────
  orderDownloads: defineTable({
    orderId:   v.id("orders"),
    userId:    v.id("users"),
    fileId:    v.id("_storage"),
    fileName:  v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_user",  ["userId"]),

  // ───────────────────────────────────────────────────────────────────────────
  // CODE ASSETS
  // Files attached to an idea that buyers get after purchase.
  // Stored in Convex File Storage.
  // ───────────────────────────────────────────────────────────────────────────
  codeAssets: defineTable({
    ideaId:     v.id("ideas"),
    fileId:     v.id("_storage"),
    fileName:   v.string(),
    fileSize:   v.number(),              // bytes
    mimeType:   v.string(),
    version:    v.string(),              // e.g. "1.0.0", "2.1.3"
    changelog:  v.optional(v.string()), // markdown
    isLatest:   v.boolean(),
    uploadedBy: v.id("users"),
    createdAt:  v.number(),
  })
    .index("by_idea",          ["ideaId"])
    .index("by_idea_latest",   ["ideaId", "isLatest"]),

  // ───────────────────────────────────────────────────────────────────────────
  // CUSTOMIZATION REQUESTS
  // After a buyer pays a deposit, they fill out requirements here.
  // Admins track status and communicate through this record.
  // ───────────────────────────────────────────────────────────────────────────
  customizationRequests: defineTable({
    orderId:  v.id("orders"),
    userId:   v.id("users"),
    ideaId:   v.id("ideas"),

    status: v.union(
      v.literal("submitted"),
      v.literal("reviewing"),
      v.literal("quoted"),
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("review_ready"),   // client review
      v.literal("completed"),
      v.literal("cancelled")
    ),

    // Brief from the buyer
    brandName:       v.optional(v.string()),
    brandColors:     v.optional(v.array(v.string())),
    brandLogoFileId: v.optional(v.id("_storage")),
    targetDomain:    v.optional(v.string()),
    customFeatures:  v.optional(v.string()),  // markdown list of extras
    additionalNotes: v.optional(v.string()),

    // Quote from admin
    quotedPrice:     v.optional(v.number()),  // USD cents, beyond deposit
    quotedTimeline:  v.optional(v.string()),  // e.g. "5–7 business days"
    quoteExpiresAt:  v.optional(v.number()),
    quoteAcceptedAt: v.optional(v.number()),

    // Delivery
    deliveredUrl:    v.optional(v.string()),  // deployed URL for client
    deliveredAt:     v.optional(v.number()),

    // Communication thread handled in customizationMessages
    createdAt:   v.number(),
    updatedAt:   v.number(),
  })
    .index("by_order",  ["orderId"])
    .index("by_user",   ["userId"])
    .index("by_status", ["status"]),

  // ───────────────────────────────────────────────────────────────────────────
  // CUSTOMIZATION MESSAGES
  // Threaded chat between buyer and admin team within a customization request.
  // ───────────────────────────────────────────────────────────────────────────
  customizationMessages: defineTable({
    requestId:  v.id("customizationRequests"),
    senderId:   v.id("users"),
    senderRole: v.union(v.literal("client"), v.literal("admin")),
    body:       v.string(),                        // markdown
    attachmentIds: v.array(v.id("_storage")),
    isRead:     v.boolean(),
    createdAt:  v.number(),
  })
    .index("by_request",          ["requestId"])
    .index("by_request_unread",   ["requestId", "isRead"]),

  // ───────────────────────────────────────────────────────────────────────────
  // REVIEWS
  // Buyers can leave a review after purchasing an idea.
  // ───────────────────────────────────────────────────────────────────────────
  reviews: defineTable({
    ideaId:   v.id("ideas"),
    userId:   v.id("users"),
    orderId:  v.optional(v.id("orders")),

    rating:   v.number(),             // 1–5
    title:    v.optional(v.string()),
    body:     v.optional(v.string()), // markdown
    pros:     v.array(v.string()),
    cons:     v.array(v.string()),

    // Moderation
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    adminNotes: v.optional(v.string()),

    // Engagement
    helpfulCount:    v.number(),
    notHelpfulCount: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_idea",         ["ideaId"])
    .index("by_user",         ["userId"])
    .index("by_idea_status",  ["ideaId", "status"])
    .index("by_status",       ["status"]),

  // ───────────────────────────────────────────────────────────────────────────
  // REVIEW VOTES  (helpful / not helpful)
  // ───────────────────────────────────────────────────────────────────────────
  reviewVotes: defineTable({
    reviewId:  v.id("reviews"),
    userId:    v.id("users"),
    vote:      v.union(v.literal("helpful"), v.literal("not_helpful")),
    createdAt: v.number(),
  })
    .index("by_review",      ["reviewId"])
    .index("by_user_review", ["userId", "reviewId"]),

  // ───────────────────────────────────────────────────────────────────────────
  // SAVES  (user bookmarks / wishlist)
  // ───────────────────────────────────────────────────────────────────────────
  saves: defineTable({
    userId:    v.id("users"),
    ideaId:    v.id("ideas"),
    createdAt: v.number(),
  })
    .index("by_user",      ["userId"])
    .index("by_idea",      ["ideaId"])
    .index("by_user_idea", ["userId", "ideaId"]),

  // ───────────────────────────────────────────────────────────────────────────
  // IDEA VIEWS  (analytics — one row per visit)
  // ───────────────────────────────────────────────────────────────────────────
  ideaViews: defineTable({
    ideaId:      v.id("ideas"),
    userId:      v.optional(v.id("users")),  // null = anonymous
    sessionId:   v.string(),                 // browser-generated UUID
    referrer:    v.optional(v.string()),
    utmSource:   v.optional(v.string()),
    utmMedium:   v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    country:     v.optional(v.string()),
    device:      v.optional(v.string()),     // "mobile" | "desktop" | "tablet"
    createdAt:   v.number(),
  })
    .index("by_idea",         ["ideaId"])
    .index("by_idea_created", ["ideaId", "createdAt"])
    .index("by_user",         ["userId"]),

  // ───────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // In-app notifications for users (order confirmed, customization update, etc.)
  // ───────────────────────────────────────────────────────────────────────────
  notifications: defineTable({
    userId:  v.id("users"),
    type: v.union(
      v.literal("order_confirmed"),
      v.literal("code_ready"),
      v.literal("customization_update"),
      v.literal("customization_message"),
      v.literal("quote_received"),
      v.literal("review_approved"),
      v.literal("new_idea_in_category"),
      v.literal("exclusive_available"),
      v.literal("system")
    ),
    title:       v.string(),
    body:        v.string(),
    actionUrl:   v.optional(v.string()),
    relatedId:   v.optional(v.string()),  // orderId | ideaId | requestId
    isRead:      v.boolean(),
    createdAt:   v.number(),
  })
    .index("by_user",        ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  // ───────────────────────────────────────────────────────────────────────────
  // WAITLIST  (for exclusive ideas or coming-soon ideas)
  // ───────────────────────────────────────────────────────────────────────────
  waitlist: defineTable({
    ideaId:    v.id("ideas"),
    userId:    v.optional(v.id("users")),
    email:     v.string(),
    notified:  v.boolean(),
    createdAt: v.number(),
  })
    .index("by_idea",          ["ideaId"])
    .index("by_email",         ["email"])
    .index("by_idea_notified", ["ideaId", "notified"]),

  // ───────────────────────────────────────────────────────────────────────────
  // DISCOUNT CODES
  // Admin-created promo codes, redeemable at checkout.
  // ───────────────────────────────────────────────────────────────────────────
  discountCodes: defineTable({
    code:          v.string(),
    description:   v.optional(v.string()),
    discountType:  v.union(v.literal("percent"), v.literal("fixed")),
    discountValue: v.number(),      // % (0–100) or USD cents
    maxUses:       v.optional(v.number()),
    usedCount:     v.number(),
    // Restrictions
    applicableIdeaIds: v.optional(v.array(v.id("ideas"))),  // null = all
    minOrderAmount:    v.optional(v.number()),               // USD cents
    expiresAt:         v.optional(v.number()),
    isActive:          v.boolean(),
    createdBy:         v.id("users"),
    createdAt:         v.number(),
  })
    .index("by_code",     ["code"])
    .index("by_isActive", ["isActive"]),

  // ───────────────────────────────────────────────────────────────────────────
  // DISCOUNT CODE USAGES  (join table — who used which code)
  // ───────────────────────────────────────────────────────────────────────────
  discountCodeUsages: defineTable({
    discountCodeId: v.id("discountCodes"),
    userId:         v.id("users"),
    orderId:        v.id("orders"),
    amountSaved:    v.number(),   // USD cents
    createdAt:      v.number(),
  })
    .index("by_code",  ["discountCodeId"])
    .index("by_user",  ["userId"])
    .index("by_order", ["orderId"]),

  // ───────────────────────────────────────────────────────────────────────────
  // AFFILIATE LINKS
  // Partners earn a commission on referred sales.
  // ───────────────────────────────────────────────────────────────────────────
  affiliateLinks: defineTable({
    userId:          v.id("users"),
    code:            v.string(),              // URL param: ?ref=CODE
    commissionRate:  v.number(),              // e.g. 0.20 = 20%
    totalClicks:     v.number(),
    totalSales:      v.number(),             // USD cents
    totalEarnings:   v.number(),             // USD cents
    isActive:        v.boolean(),
    createdAt:       v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["code"]),

  // ───────────────────────────────────────────────────────────────────────────
  // AFFILIATE CONVERSIONS
  // Each sale attributed to an affiliate.
  // ───────────────────────────────────────────────────────────────────────────
  affiliateConversions: defineTable({
    affiliateLinkId: v.id("affiliateLinks"),
    affiliateUserId: v.id("users"),
    buyerUserId:     v.id("users"),
    orderId:         v.id("orders"),
    saleAmount:      v.number(),       // USD cents
    commissionEarned: v.number(),      // USD cents
    isPaid:          v.boolean(),
    paidAt:          v.optional(v.number()),
    createdAt:       v.number(),
  })
    .index("by_affiliate_link",  ["affiliateLinkId"])
    .index("by_affiliate_user",  ["affiliateUserId"])
    .index("by_order",           ["orderId"])
    .index("by_is_paid",         ["isPaid"]),

  // ───────────────────────────────────────────────────────────────────────────
  // SITE SETTINGS
  // Key-value store for admin-controlled global config.
  // ───────────────────────────────────────────────────────────────────────────
  siteSettings: defineTable({
    key:       v.string(),
    value:     v.string(),     // JSON-serialized
    label:     v.optional(v.string()),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // ───────────────────────────────────────────────────────────────────────────
  // AUDIT LOG
  // Immutable record of all admin actions (GDPR, accountability, debugging).
  // ───────────────────────────────────────────────────────────────────────────
  auditLog: defineTable({
    actorId:    v.id("users"),
    action:     v.string(),        // e.g. "idea.publish", "order.refund"
    targetType: v.string(),        // e.g. "idea", "order", "user"
    targetId:   v.string(),
    metadata:   v.optional(v.string()),  // JSON — diff or extra context
    ipAddress:  v.optional(v.string()),
    createdAt:  v.number(),
  })
    .index("by_actor",       ["actorId"])
    .index("by_target",      ["targetType", "targetId"])
    .index("by_created",     ["createdAt"]),
});
