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
  opts: RequestInit & { dryrun?: boolean } = {}
) {
  const url = appendToken(
    `https://www.premiumize.me/api/${path.replace(/^\//, "")}`
  );

  console.debug(`[fetch] [${opts.method ?? "GET"}] ${url}`);
  console.debug(`[fetch] options: ${JSON.stringify(opts, null, 2)}`);

  if (opts.dryrun) {
    console.debug("[fetch] Dry run mode, not actually fetching.");
    return schema.parse({} as T); // Return an empty object for dry run
  }

  const [resErr, res] = await to(
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...opts,
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
  /** services/list */
  listServices: () => api("services/list", Schema_ServicesList),
  /** cache/check */
  checkCache: (urls: string[]) => {
    const params = urls
      .map((url) => `items[]=${encodeURIComponent(url)}`)
      .join("&");
    return api(`cache/check?${encodeURIComponent(params)}`, Schema_CacheCheck);
  },
  /** folder/list */
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
    const formData = new URLSearchParams({
      name,
    });
    if (parentId) {
      formData.set("parent_id", parentId);
    }
    console.debug({ formData });
    return api(path, Schema_FolderCreate, {
      method: "POST",
      body: formData.toString(),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },
};
