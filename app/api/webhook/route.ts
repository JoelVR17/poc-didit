import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * POST /api/webhook
 * Receive signed webhooks from Didit
 * Documentation: https://docs.didit.me/reference/webhooks
 *
 * IMPORTANT: Verify HMAC-SHA256 signature always
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Try multiple possible header names just in case the provider changes casing/naming
    const signatureHeaderNames = [
      "x-webhook-signature",
      "x-webhook-signature-256",
      "x-didit-signature",
      "x-didit-webhook-signature",
      "x-signature",
    ];
    const signature = signatureHeaderNames
      .map((name) => req.headers.get(name))
      .find(Boolean);

    if (!signature) {
      // Log headers to understand what the provider is actually sending
      console.error("No signature in webhook. Incoming headers:", {
        headers: Object.fromEntries(req.headers),
      });
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error("Missing DIDIT_WEBHOOK_SECRET env var");
      return NextResponse.json(
        { error: "Missing webhook secret" },
        { status: 500 }
      );
    }

    const hash = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    const isValid = hash === signature;

    if (!isValid) {
      console.error("❌ Firma inválida!");
      console.log("  Esperado:", signature);
      console.log("  Calculado:", hash);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    console.log("✅ Signature verified");

    const webhookData = JSON.parse(body);

    console.log("📧 Webhook recibido:");
    console.log("  Session:", webhookData.session_id);
    console.log("  Status:", webhookData.status);
    if (webhookData.decision) {
      console.log("  Decision:", webhookData.decision.result);
    }

    const dataDir = path.join(process.cwd(), "data");
    const webhookFile = path.join(dataDir, "webhooks.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let webhooks: any[] = [];
    if (fs.existsSync(webhookFile)) {
      const content = fs.readFileSync(webhookFile, "utf-8");
      webhooks = JSON.parse(content);
    }

    const newWebhook = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: webhookData.session_id,
      status: webhookData.status,
      decision: webhookData.decision,
      document: webhookData.document,
      aml_screening: webhookData.aml_screening,
      raw: webhookData,
    };

    webhooks.push(newWebhook);

    fs.writeFileSync(webhookFile, JSON.stringify(webhooks, null, 2));

    console.log("💾 Webhook guardado en:", webhookFile);

    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed",
        id: newWebhook.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing webhook:", error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhook
 * View received webhooks (only for testing)
 */
export async function GET() {
  const webhookFile = path.join(process.cwd(), "data", "webhooks.json");

  if (!fs.existsSync(webhookFile)) {
    return NextResponse.json({
      total: 0,
      webhooks: [],
      message: "No webhooks received yet",
    });
  }

  const content = fs.readFileSync(webhookFile, "utf-8");
  const webhooks = JSON.parse(content);

  return NextResponse.json({
    total: webhooks.length,
    webhooks,
    note: "View in data/webhooks.json",
  });
}
