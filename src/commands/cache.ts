import { premiumizeApi } from "@/lib/premiumizeApi";
import to from "await-to-js";
import { Command } from "commander";

export function registerCache(app: Command) {
  app
    .command("cache")
    .argument("<urls>", "URLs to check in the cache, space-separated")
    .description("Check the cache for url")
    .option("-j, --json", "Output in JSON format", false)
    .option("-d, --details", "Show detailed cache information", false)
    .action(async (_, opts) => {
      const urls = ((opts?.urls as string) ?? "")
        .split(/\s+/)
        .map((url) => url.trim());
      const { json, details } = opts;

      const [cacheErr, cache] = await to(premiumizeApi.cache.check(urls));
      if (cacheErr) {
        console.error("Failed to check cache:", cacheErr.message);
        process.exit(1);
      }

      if (json) {
        console.log(JSON.stringify(cache, null, 2));
      } else {
        cache.filename.forEach((fn, index) => {
          if (details) {
            console.log(JSON.stringify(cache, null, 2));
            return;
          }

          const cached = cache.response[index];
          const transcoded = cache.transcoded[index];
          const filesize = cache.filesize[index];

          console.log(`- ${fn} (${cached ? "Cached" : "Not cached"})`);
        });
      }
    });
}
