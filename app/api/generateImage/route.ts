import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Together from "together-ai";
import { z } from "zod";

let ratelimit: Ratelimit | undefined;

if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(100, "1440 m"),
    analytics: true,
    prefix: "keystrokeimagen",
  });
}

export async function POST(req: Request) {
  let json = await req.json();
  let { prompt, userAPIKey, iterativeMode } = z
    .object({
      prompt: z.string(),
      iterativeMode: z.boolean(),
      userAPIKey: z.string().optional(),
    })
    .parse(json);

  let options: ConstructorParameters<typeof Together>[0] = {};

  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-BYOK": userAPIKey ? "true" : "false",
    };
  }

  const client = new Together(options);

  if (userAPIKey) {
    client.apiKey = userAPIKey;
  } else if (process.env.TOGETHER_API_KEY) {
    client.apiKey = process.env.TOGETHER_API_KEY as string;
  }

  if (!userAPIKey && !process.env.TOGETHER_API_KEY) {
    return NextResponse.json(
      { error: "API key is required. Please provide your Together API key." },
      { status: 401 }
    );
  }

  if (ratelimit && !userAPIKey) {
    const identifier = getIPAddress();
    const { success, reset } = await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "No requests left. Please add your own API Key or try again later.",
          resetAt: reset,
        },
        { status: 429 }
      );
    }
  }

  let response;

  try {
    response = await client.images.create({
      prompt,
      model: "black-forest-labs/FLUX.1-schnell",
      width: 1024,
      height: 768,
      seed: iterativeMode ? 123 : undefined,
      steps: 3,
      // @ts-expect-error
      response_format: "base64",
    });
  } catch (e: any) {
    const errorMessage = e.message || e.toString();
    return NextResponse.json(
      {
        error: errorMessage,
        code: e.status || 500,
        details: e.response?.data || null,
      },
      { status: e.status || 500 }
    );
  }

  return Response.json(response.data[0]);
}

function getIPAddress() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = headers().get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return headers().get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}
