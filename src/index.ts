import "@/env.js";
import { Command } from "commander";
import { appEnv } from "./env.js";
import { registerServices } from "./commands/services.js";
import { registerFolder } from "./commands/folder.js";
import { registerTransfers } from "./commands/transfers.js";
import { registerItem } from "./commands/item.js";
import { registerCache } from "./commands/cache.js";

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
  .option(
    "-d, --dryrun",
    "Dry run mode, no actual API calls will be made",
    false
  );

registerServices(app);
registerFolder(app);
registerTransfers(app);
registerCache(app);
registerItem(app);

app.parse();
