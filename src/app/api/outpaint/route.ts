import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
// Outpainting is dynamic per-request; never cache.
export const dynamic = "force-dynamic";

const MODEL = "@cf/runwayml/stable-diffusion-v1-5-inpainting";

// Pure automatic fill: steer the model to extend ONLY the empty background, not
// to invent new subjects. The strong negative prompt suppresses the most common
// hallucinations (duplicated cars, people, etc.).
const PROMPT =
  "empty plain background, smooth seamless backdrop, continuous floor and wall, soft even lighting, same colors and gradient as the surroundings, no objects, no subjects, photorealistic, clean";
const NEGATIVE_PROMPT =
  "car, vehicle, suv, truck, automobile, wheel, person, people, man, woman, human, animal, duplicate, repeated object, extra subject, copy, mirror image, text, watermark, logo, border, frame, seam, distorted, artifacts";

interface OutpaintBody {
  imageB64?: string;
  maskB64?: string;
  width?: number;
  height?: number;
}

export async function POST(req: NextRequest) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    return NextResponse.json(
      { error: "Server is missing Cloudflare credentials." },
      { status: 500 },
    );
  }

  let body: OutpaintBody;
  try {
    body = (await req.json()) as OutpaintBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { imageB64, maskB64, width, height } = body;
  if (!imageB64 || !maskB64 || !width || !height) {
    return NextResponse.json(
      { error: "Missing image, mask, or dimensions." },
      { status: 400 },
    );
  }

  // Cloudflare's inpainting model expects the image/mask as arrays of the
  // encoded PNG file bytes.
  const image = Array.from(Buffer.from(imageB64, "base64"));
  const mask = Array.from(Buffer.from(maskB64, "base64"));

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

  let cfRes: Response;
  try {
    cfRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: PROMPT,
        negative_prompt: NEGATIVE_PROMPT,
        image,
        mask,
        width,
        height,
        num_steps: 20,
        // Low strength => refine the blurred background seed instead of
        // generating fresh content from noise (which invents new subjects).
        strength: 0.65,
        // Lower guidance keeps it faithful to the surrounding background.
        guidance: 6,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach Cloudflare.", detail: String(err) },
      { status: 502 },
    );
  }

  if (!cfRes.ok) {
    const detail = await cfRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Cloudflare error (${cfRes.status}).`, detail: detail.slice(0, 600) },
      { status: 502 },
    );
  }

  const contentType = cfRes.headers.get("content-type") ?? "";

  // Some Workers AI responses wrap a base64 image in JSON; others stream PNG.
  if (contentType.includes("application/json")) {
    const json = (await cfRes.json()) as {
      result?: { image?: string };
      success?: boolean;
      errors?: unknown;
    };
    const b64 = json?.result?.image;
    if (!b64) {
      return NextResponse.json(
        { error: "Unexpected AI response.", detail: JSON.stringify(json).slice(0, 600) },
        { status: 502 },
      );
    }
    return new NextResponse(new Uint8Array(Buffer.from(b64, "base64")), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  const arrayBuffer = await cfRes.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
