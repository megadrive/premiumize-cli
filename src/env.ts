import "dotenv/config";
import { bool, cleanEnv, str, url } from "envalid";

export const appEnv = cleanEnv(process.env, {
  VERBOSE_LOGGING: bool({
    desc: "Enable verbose logging",
    default: false,
  }),
  PREMIUMIZE_API_URL: url({
    desc: "The URL of the Premiumize.me API",
    default: "https://www.premiumize.me/api",
    example: "https://www.premiumize.me/api",
  }),
  PREMIUMIZE_API_KEY: str({
    desc: "Your Premiumize.me API key.",
    example: "1234567890abcdef1234567890abcdef",
  }),
  DRYRUN: bool({
    desc: "Enable dry run mode, which does not perform any actual API calls. Useful for development and testing.",
    default: false,
  }),
  PREMIUMIZE_CLIENT_ID: str({
    desc: "Your Premiumize.me client ID.",
    example: "your-client-id",
    requiredWhen: (env) => !!env.PREMIUMIZE_CLIENT_SECRET,
  }),
  PREMIUMIZE_CLIENT_SECRET: str({
    desc: "Your Premiumize.me client secret.",
    example: "your-client-secret",
    default: "",
    requiredWhen: (env) => !!env.PREMIUMIZE_CLIENT_ID,
  }),
});
