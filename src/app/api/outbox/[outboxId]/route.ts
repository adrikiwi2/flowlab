import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getTenantId } from "@/lib/get-tenant";
import { getOutboxItem, updateOutboxStatus, createMessage, getFlowVariables } from "@/lib/db";
import { sendTextMessage } from "@/lib/composio";
import { renderVariables } from "@/lib/prompt-builder";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ outboxId: string }> }
) {
  await getTenantId();
  const { outboxId } = await params;
  const { action } = (await request.json()) as { action: "approve" | "reject" };

  const item = await getOutboxItem(outboxId);
  if (!item || item.status !== "pending") {
    return NextResponse.json({ error: "Outbox item not found or already processed" }, { status: 404 });
  }

  if (action === "reject") {
    await updateOutboxStatus(outboxId, "rejected");
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  if (action === "approve") {
    const payload = JSON.parse(item.payload_json);

    try {
      // Render flow variables in the message text before sending
      const flowId = payload.flow_id as string | undefined;
      const variables = flowId ? await getFlowVariables(flowId) : [];
      const renderedText = renderVariables(payload.text, variables);

      const { messageId } = await sendTextMessage(
        payload.composio_user_id,
        payload.recipient_id,
        renderedText
      );

      await updateOutboxStatus(outboxId, "sent");

      await createMessage({
        id: nanoid(),
        lead_id: item.lead_id,
        direction: "outbound",
        text: payload.text,
        platform_message_id: messageId || undefined,
        detected_status: payload.inference_result?.detected_status,
        suggested_template_id: payload.template_id,
        inference_result_json: JSON.stringify(payload.inference_result),
      });

      return NextResponse.json({ ok: true, status: "sent", messageId });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await updateOutboxStatus(outboxId, "failed", errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
