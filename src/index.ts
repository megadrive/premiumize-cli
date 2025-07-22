import "./env.js";
import { Command } from "commander";
import { premiumizeApi } from "./lib/premiumizeApi.js";
import to from "await-to-js";
import { appEnv } from "./env.js";
import z, { ZodError } from "zod";

const version = "0.0.1";

if (!appEnv.VERBOSE_LOGGING) {
  console.debug = (..._args) => {};
} else {
  console.debug("Verbose logging is enabled.");
}

const app = new Command();

app
  .name("premiumize-cli")
  .description("A CLI for Premiumize.me, with some additional features.")
  .version(version)
  .option("--dryrun", "Dry run mode, no actual API calls will be made", false);

app
  .command("services")
  .description("List available services")
  .action(async () => {
    const [servicesErr, services] = await to(premiumizeApi.services.list());
    if (servicesErr) {
      console.error("Failed to fetch services:", servicesErr.message);
      process.exit(1);
    }
    console.log("Available services:");
    console.log(JSON.stringify(services, null, 2));
  });

app
  .command("cache")
  .argument("<urls>", "URLs to check in the cache, comma-separated")
  .description("Check the cache for url")
  .option("-j, --json", "Output in JSON format", false)
  .option("-d, --details", "Show detailed cache information", false)
  .action(async (_, opts) => {
    const urls = ((opts?.urls as string) ?? "")
      .split(",")
      .map((url) => url.trim());
    const { json, details } = opts;

    const [cacheErr, cache] = await to(premiumizeApi.cache.check(urls));
    if (cacheErr) {
      console.error("Failed to check cache:", cacheErr.message);
      process.exit(1);
    }

    console.log("Cache check result:");

    if (json) {
      console.log(JSON.stringify(cache, null, 2));
    } else {
      console.info("Cached items:");
      cache.filename.forEach((fn, index) => {
        const cached = cache.response[index];
        const transcoded = cache.transcoded[index];
        const filesize = cache.filesize[index];

        console.log(`- ${fn} (${cached ? "Cached" : "Not cached"})`);
      });
    }
  });

/** folder subcommands */
const folder = app.command("folder");

folder
  .command("list")
  .alias("ls")
  .description("List items in a folder")
  .argument("[folderId]", "ID of the folder to list")
  .option(
    "-b, --include-breadcrumbs",
    "Include breadcrumbs in the output",
    false
  )
  .option("-j, --json", "Output in JSON format", false)
  .description("List items in a folder")
  .action(async function (_, arg, opts) {
    const folderId = arg.folderId ?? undefined;
    const { includeBreadcrumbs, json } = opts;
    const [listErr, folderList] = await to(
      premiumizeApi.folder.list({
        folderId,
        includeBreadcrumbs,
      })
    );
    if (listErr) {
      console.error("Failed to list folder:", listErr.message);
      process.exit(1);
    }
    console.log(`Items in folder ${folderId ?? "Root"}:`);

    if (json) {
      console.log(JSON.stringify(folderList, null, 2));
    } else {
      folderList.content.forEach((item) => {
        console.log(
          `- ${item.name.replace(/[\r?\n|\r|\n]/g, "")}${
            item.type === "folder" ? "/" : ""
          } (${item.id})`
        );
      });
    }
  });

folder
  .command("create")
  .argument("<name>", "Name of the new folder")
  .argument("[parentId]", "ID of the parent folder")
  .option("-j, --json", "Output in JSON format", false)
  .description("Create a new folder")
  .action(async (name, parentId, opts) => {
    console.info({ name, parentId, opts });
    const { json } = opts;

    const [createErr, newFolder] = await to(
      premiumizeApi.folder.create({
        name,
        parentId: parentId ?? undefined,
      })
    );

    if (createErr) {
      console.error("Failed to create folder:", createErr.message);
      process.exit(1);
    }

    if (newFolder.status === "error") {
      console.error("Error creating folder:", newFolder.message);
      process.exit(1);
    }

    if (json) {
      console.log(JSON.stringify(newFolder, null, 2));
    } else {
      console.log(`Folder created: ${name} (${newFolder.id})`);
    }
  });

folder
  .command("search")
  .argument("<query>", "Search query")
  .description("Search for items in a folder, including root")
  .option("-j, --json", "Output in JSON format", false)
  .action(async (query, opts) => {
    const { json } = opts;
    const [searchErr, searchResults] = await to(
      premiumizeApi.folder.search({
        q: query,
      })
    );
    if (searchErr) {
      console.error("Failed to search folder:", searchErr.message);
      process.exit(1);
    }
    console.log(`Search results for "${query}":`);
    if (json) {
      console.log(JSON.stringify(searchResults, null, 2));
    } else {
      searchResults.content.forEach((item) => {
        console.log(
          `- ${item.name.replace(/[\r?\n|\r|\n]/g, "")}${
            item.type === "folder" ? "/" : ""
          } (${item.id})`
        );
      });
    }
  });

/**
 * @todo add option to rename folder by name instead of id
 */
folder
  .command("rename")
  .argument("<folderId>", "ID of the folder to rename")
  .argument("<newName>", "New name for the folder")
  .option("-j, --json", "Output in JSON format", false)
  .description("Rename a folder")
  .action(async (folderId, newName, opts) => {
    const { json } = opts;
    const [renameErr, renameResult] = await to(
      premiumizeApi.folder.rename({
        id: folderId,
        name: newName,
      })
    );
    if (renameErr) {
      console.error("Failed to rename folder:", renameErr.message);
      process.exit(1);
    }
    if (renameResult.status === "error") {
      console.error("Error renaming folder:", renameResult.message);
      process.exit(1);
    }
    if (json) {
      console.log(JSON.stringify(renameResult, null, 2));
    }
    console.log(`Folder renamed: ${folderId} -> ${newName}`);
  });

folder
  .command("delete")
  .aliases(["rm", "del"])
  .argument("<folderId>", "ID of the folder to delete")
  .option("-j, --json", "Output in JSON format", false)
  .description("Delete a folder")
  .action(async (folderId, opts) => {
    const { json } = opts;
    const [deleteErr, deleteResult] = await to(
      premiumizeApi.folder.delete({
        id: folderId,
      })
    );
    if (deleteErr) {
      console.error("Failed to delete folder:", deleteErr.message);
      process.exit(1);
    }
    if (deleteResult.status === "error") {
      console.error("Error deleting folder:", deleteResult.message);
      process.exit(1);
    }
    if (json) {
      console.log(JSON.stringify(deleteResult, null, 2));
    }
    console.log(`Folder deleted: ${folderId}`);
  });

/** Item */
const item = app.command("item").description("Manage items in folders");

item
  .command("listall")
  .aliases(["list", "ls"])
  .option("-j, --json", "Output in JSON format", false)
  .description("List all items in all folders")
  .action(async (opts) => {
    const { json } = opts;

    const [listAllErr, items] = await to(premiumizeApi.item.listall());
    if (listAllErr) {
      if (listAllErr instanceof ZodError || listAllErr.name === "ZodError") {
        console.error("Validation error while listing all items:");
        console.error(
          (listAllErr as ZodError).issues.map((issue) => issue.path).join("\n")
        );
      } else {
        console.error("Failed to list all items:", listAllErr.message);
      }
      process.exit(1);
    }
    if (items.status === "error") {
      console.error("Error listing all items");
      process.exit(1);
    }
    console.log("All items in all folders:");
    if (json) {
      console.log(JSON.stringify(items, null, 2));
    } else {
      items.files.forEach((item) => {
        console.log(
          `- ${item.name.replace(/[\r?\n|\r|\n]/g, "")} (${item.id})`
        );
      });
    }
  });

item
  .command("details")
  .argument("<itemId>", "ID of the item to get details for")
  .option("-j, --json", "Output in JSON format", false)
  .description("Get details of an item")
  .action(async (itemId, opts) => {
    const { json } = opts;
    const [detailsErr, itemDetails] = await to(
      premiumizeApi.item.details({
        id: itemId,
      })
    );
    if (detailsErr) {
      if (detailsErr instanceof ZodError || detailsErr.name === "ZodError") {
        console.error("Validation error while getting item details:");
        console.error(
          (detailsErr as ZodError).issues.map((issue) => issue.path).join("\n")
        );
      } else {
        console.error("Failed to get item details:", detailsErr.message);
      }
      process.exit(1);
    }

    if (json) {
      console.log(JSON.stringify(itemDetails, null, 2));
      process.exit(0);
    }
    console.log(`Item details for ${itemId}:`);

    // loop through each key and output
    Object.entries(itemDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        console.log(`- ${key}: ${value}`);
      }
    });
  });

app.parse();
