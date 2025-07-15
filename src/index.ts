import "./env.js";
import { Command } from "commander";
import { version } from "../package.json";
import { premiumizeApi } from "./lib/premiumizeApi.js";
import to from "await-to-js";

const app = new Command();

app
  .name("premiumize-cli")
  .description("A CLI for Premiumize.me, with some additional features.")
  .version(version);

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
  .argument("<url>", "URL to check in the cache")
  .description("Check the cache for url")
  .action(async (url) => {
    const [cacheErr, cache] = await to(premiumizeApi.checkCache(url));
    if (cacheErr) {
      console.error("Failed to check cache:", cacheErr.message);
      process.exit(1);
    }

    console.log("Cache check result:");
    console.log(JSON.stringify(cache, null, 2));
  });

app
  .command("folder list")
  .argument("[folderId]", "ID of the folder to list")
  .option(
    "-b, --include-breadcrumbs",
    "Include breadcrumbs in the output",
    false
  )
  .option("-j, --json", "Output in JSON format", false)
  .description("List items in a folder")
  .action(async function (_, arg, opts) {
    const folderId = arg ?? undefined;
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

app
  .command("folder create")
  .argument("<name>", "Name of the new folder")
  .argument("[parentId]", "ID of the parent folder (optional)")
  .description("Create a new folder")
  .action(async (_, name, parentId) => {
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
    console.log(`Folder created: ${name} (${newFolder.id})`);
  });

app.parse();
