import z from "zod";
import { appEnv } from "../env";
import { to } from "await-to-js";
import {
  Schema_CacheCheck,
  Schema_FolderCreate,
  Schema_FolderList,
  Schema_ServicesList,
} from "./premiumize.types";

function appendToken(url: string) {
  const token = appEnv.PREMIUMIZE_API_KEY;
  if (token) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}apikey=${token}`;
  }
  return url;
}

async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  fetchOpts: RequestInit = {}
) {
  const url = appendToken(
    `https://www.premiumize.me/api/${path.replace(/^\//, "")}`
  );
  const [resErr, res] = await to(
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...fetchOpts,
    })
  );

  if (resErr || !res.ok) {
    if (resErr) {
      throw new Error(`Failed to fetch ${url}: ${resErr.message}`);
    }

    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const [jsonErr, json] = await to(res.json());
  if (jsonErr) {
    throw new Error(`Failed to parse JSON from ${url}: ${jsonErr.message}`);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Invalid response from ${url}: ${JSON.stringify(parsed.error, null, 2)}`
    );
  }
  return parsed.data;
}

export const premiumizeApi = {
  listServices: () => api("services/list", Schema_ServicesList),
  checkCache: (url: string) => api("cache/check", Schema_CacheCheck),
  listFolder: (
    options: {
      folderId?: string;
      includeBreadcrumbs?: boolean;
    } = {}
  ) => {
    const { folderId, includeBreadcrumbs } = options;
    let path = "folder/list";
    const args = new URLSearchParams();
    if (folderId) {
      args.append("id", encodeURIComponent(folderId));
    }
    if (includeBreadcrumbs) {
      args.append("include_breadcrumbs", "true");
    }
    return api(
      `${path}${args.size > 0 ? `?${args.toString()}` : ""}`,
      Schema_FolderList
    );
  },
  createFolder: (opts: { name: string; parentId?: string }) => {
    const { name, parentId } = opts;

    if (name.length < 1 || name.length > 100) {
      throw new Error("Folder name must be between 1 and 100 characters.");
    }

    const path = "folder/create";
    const formData = new FormData();
    formData.set("name", name);
    if (parentId) {
      formData.set("parent_id", parentId);
    }
    return api(path, Schema_FolderCreate, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },
};
