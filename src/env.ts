import "dotenv/config";
import { cleanEnv, str, url } from "envalid";

export const appEnv = cleanEnv(process.env, {
  PREMIUMIZE_API_URL: url({
    desc: "The URL of the Premiumize.me API",
    default: "https://www.premiumize.me/api",
    example: "https://www.premiumize.me/api",
  }),
  PREMIUMIZE_API_KEY: str({
    desc: "Your Premiumize.me API key.",
    example: "1234567890abcdef1234567890abcdef",
  }),
});
