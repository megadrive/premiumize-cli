import z from "zod";

const ApiResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  message: z.string().optional(),
});

const ItemDetailsSchema = z.object({
  size: z.number(),
  created_at: z.number(),
  mime_type: z.string(),
  transcode_status: z.enum([
    "not_applicable",
    "running",
    "finished",
    "pending",
    "good_as_is",
    "error",
    "fetch_pending",
  ]),
  link: z.string(),
  stream_link: z.string(),
  virus_scan: z.enum(["ok", "infected", "error"]),
});

const ItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["file", "folder"]),
  })
  .extend(ItemDetailsSchema.partial().shape);

// API responses
export const Schema_ServicesList = z.object({
  cache: z.array(z.string()),
  directdl: z.array(z.string()),
  queue: z.array(z.string()),
  fairusefactor: z.record(z.string(), z.number()),
  aliases: z.record(z.string(), z.array(z.string())),
  regexpatterns: z.record(z.string(), z.array(z.string())),
});

export const Schema_CacheCheck = z.object({
  status: z.union([z.literal("success"), z.literal("error")]),
  response: z.array(z.boolean()),
  transcoded: z.array(z.boolean()),
  filename: z.array(z.string()),
  filesize: z.array(z.string()),
});

export const Schema_FolderList = z.object({
  status: z.union([z.literal("success"), z.literal("error")]),
  content: z.array(ItemSchema),
  breadcrumbs: z
    .object({
      id: z.string(),
      name: z.string(),
      parent_id: z.string().optional(),
    })
    .optional(),
});

export const Schema_FolderCreate = z.object({
  status: z.enum(["success", "error"]),
  message: z.string().optional(),
  id: z.string().optional(),
});
