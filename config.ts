import { cleanEnv, num, str } from "./deps.ts"

export const config = cleanEnv(Deno.env.toObject(), {
    PORT: num({
      default: 80,
    }),
    BOT_TOKEN: str(),
    CHAT_ID: str(),
  })