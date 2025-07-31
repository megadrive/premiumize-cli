import { premiumizeApi } from "@/lib/premiumizeApi";
import to from "await-to-js";
import type { Command } from "commander";

export function registerFolder(app: Command) {
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
    .action(async function (folderId, opts) {
      console.info({ folderId, opts });
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
}
