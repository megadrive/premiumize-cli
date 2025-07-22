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

export const Schema_ItemFullDetails = z.object({
  id: z.string().nullish(),
  name: z.string().nullish(),
  type: z.enum(["file", "folder"]).nullish(),
  size: z.number().nullish(),
  created_at: z.number().nullish(),
  folder_id: z.string().optional(),
  acodec: z.string().optional(),
  vcodec: z.string().optional(),
  link: z.string().optional(),
  mime_type: z.string().optional(),
  opensubtitles_hash: z.string().optional(),
  resx: z.string().optional().nullish(),
  resy: z.string().optional().nullish(),
  duration: z.number().optional().nullish(),
  transcode_status: z
    .enum([
      "not_applicable",
      "running",
      "finished",
      "pending",
      "good_as_is",
      "error",
      "fetch_pending",
    ])
    .nullish(),
  virus_scan: z.enum(["ok", "infected", "error"]).optional().nullish(),
  stream_link: z.string().optional().nullish(),
  sudio_track_names: z.array(z.string()).optional(),
  bitrate: z.number().optional(),
});

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

export const Schema_FolderRename = z.object({
  status: z.enum(["success", "error"]),
  message: z.string().optional(),
});

export const Schema_FolderDelete = z.object({
  status: z.enum(["success", "error"]),
  message: z.string().optional(),
});

const ItemSchema_Short = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["file", "folder"]),
  created_at: z.number(),
});
export const Schema_FolderSearch = z.object({
  status: z.enum(["success", "error"]),
  content: z.array(ItemSchema_Short),
  name: z.string().optional(),
  parent_id: z.string().optional(),
  breadcrumbs: z.string().optional(),
});

const ItemSchema_ListAll = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.number(),
  size: z.number(),
  mime_type: z.string(),
  virus_scan: z.enum(["ok", "infected", "error"]).optional().nullish(),
  path: z.string(),
});
export const Schema_ItemListAll = z.object({
  status: z.enum(["success", "error"]),
  files: z.array(ItemSchema_ListAll),
});
