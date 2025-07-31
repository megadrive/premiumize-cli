import to from "await-to-js";
import type { Command } from "commander";
import { premiumizeApi } from "@/lib/premiumizeApi";

export function registerServices(app: Command) {
  app
    .command("services")
    .description("List available services")
    .action(async () => {
      const [servicesErr, services] = await to(premiumizeApi.services.list());
      if (servicesErr) {
        console.error("Failed to fetch services:", servicesErr.message);
        process.exit(1);
      }
      console.log(JSON.stringify(services, null, 2));
    });
}
