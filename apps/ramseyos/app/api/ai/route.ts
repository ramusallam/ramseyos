import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, variables, taskType, systemPrompt, userPrompt } = body;

    // Import server-side only
    const { route, interpolate, getPromptTemplate } = await import("@/lib/ai");

    let request;

    if (templateId) {
      const template = getPromptTemplate(templateId);
      if (!template) {
        return NextResponse.json({ error: `Template not found: ${templateId}` }, { status: 404 });
      }
      const interpolatedPrompt = interpolate(template.userPromptTemplate, variables || {});
      request = {
        taskType: template.taskType,
        systemPrompt: template.systemPrompt,
        userPrompt: interpolatedPrompt,
      };
    } else if (systemPrompt && userPrompt && taskType) {
      request = { taskType, systemPrompt, userPrompt };
    } else {
      return NextResponse.json(
        { error: "Provide either templateId+variables or taskType+systemPrompt+userPrompt" },
        { status: 400 }
      );
    }

    const response = await route(request);
    return NextResponse.json(response);
  } catch (err) {
    console.error("[API /ai]", err);
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
