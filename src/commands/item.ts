import { premiumizeApi } from "@/lib/premiumizeApi";
import to from "await-to-js";
import type { Command } from "commander";
import { ZodError } from "zod";

export function registerItem(app: Command) {
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
            (listAllErr as ZodError).issues
              .map((issue) => issue.path)
              .join("\n")
          );
        } else {
          console.error("Failed to list all items:", listAllErr.message);
        }
        process.exit(1);
      }
      if (items.status === "error") {
        console.error("Error listing all items.", listAllErr);
        process.exit(1);
      }
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
    .argument("<itemId>", "ID of the item")
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
            (detailsErr as ZodError).issues
              .map((issue) => issue.path)
              .join("\n")
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

  item
    .command("stream_link")
    .description("Get stream link for an item")
    .argument("<id>", "ID of the item to get stream link for")
    .option("-j, --json", "Output in JSON format", false)
    .action(async (id, opts) => {
      const { json } = opts;
      console.log({ id, opts });
      const [streamLinkErr, streamLink] = await to(
        premiumizeApi.item.details(id)
      );
      if (streamLinkErr) {
        if (
          streamLinkErr instanceof ZodError ||
          streamLinkErr.name === "ZodError"
        ) {
          console.error("Validation error while getting stream link:");
          console.error(
            (streamLinkErr as ZodError).issues
              .map((issue) => issue.path)
              .join("\n")
          );
        } else {
          console.error("Failed to get stream link:", streamLinkErr.message);
        }
        process.exit(1);
      }
      console.log(streamLink.link);
    });
}
