import { premiumizeApi } from "@/lib/premiumizeApi";
import to from "await-to-js";
import type { Command } from "commander";

export function registerTransfers(app: Command) {
  const c = app
    .command("transfer")
    .alias("transfers")
    .description("Manage transfers");

  c.command("list")
    .description("List all transfers")
    .option("-j, --json", "Output in JSON format", false)
    .action(async (opts) => {
      console.debug("Listing transfers with options:", opts);
      const { json } = opts;

      const [err, list] = await to(premiumizeApi.transfer.list());

      if (err) {
        console.error("Error listing transfers:", err);
        return;
      }

      console.info(list.transfers);
    });

  c.command("create")
    .description("Create a new transfer")
    .argument("<url>", "URL to transfer")
    .option("-j, --json", "Output in JSON format", false)
    .action(async (url, opts) => {});
}
