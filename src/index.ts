import "./env.js";
import { Command } from "commander";
import { version } from "../package.json";
import { premiumizeApi } from "./lib/premiumizeApi.js";
import to from "await-to-js";
import { appEnv } from "./env.js";

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
    const [servicesErr, services] = await to(premiumizeApi.listServices());
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

    const [cacheErr, cache] = await to(premiumizeApi.checkCache(urls));
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
      premiumizeApi.listFolder({
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
      premiumizeApi.createFolder({
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

app.parse();
