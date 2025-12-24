import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/verification
 * Create Didit session
 * Documentation: https://docs.didit.me/reference/create-session-verification-sessions
 */
export async function POST(req: NextRequest) {
  try {
    const API_KEY = process.env.DIDIT_API_KEY;
    const WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID;

    if (!API_KEY || !WORKFLOW_ID) {
      throw new Error("Missing Didit credentials in .env.local");
    }

    const response = await axios.post(
      "https://verification.didit.me/v2/session/",
      {
        workflow_id: WORKFLOW_ID,
        callback: `${process.env.NEXT_PUBLIC_APP_URL}/verification-callback`,
        vendor_data: "user-" + Date.now(),
        metadata: {
          app: "didit-test",
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          "X-Api-Key": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({
      sessionId: response.data.session_id,
      sessionToken: response.data.session_token,
      verificationUrl: response.data.url,
      status: response.data.status,
      workflowId: response.data.workflow_id,
    });
  } catch (error: any) {
    console.error(
      "Error creating session:",
      error.response?.data || error.message
    );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
