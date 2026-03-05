import type { Flow, Category, ExtractField, SimMessage } from "./types";

export function buildConversationHistory(
  messages: SimMessage[],
  roleALabel: string,
  roleBLabel: string
): string {
  return messages
    .map((m, i) => {
      const label = m.role === "a" ? roleALabel : roleBLabel;
      return `[${i + 1}] From: ${label}\n${m.body}`;
    })
    .join("\n---\n");
}

export function buildClassificationPrompt(
  flow: Flow,
  categories: Category[],
  extractFields: ExtractField[],
  conversationHistory: string
): string {
  const categoryRules = categories
    .map((c) => `- STATUS: "${c.name}" → ${c.rules}`)
    .join("\n");

  const extractionFields =
    extractFields.length > 0
      ? extractFields
          .map(
            (f) =>
              `"${f.field_name}": "${f.field_type} | null"  // ${f.description}`
          )
          .join(",\n      ")
      : '"notes": "string | null"  // Any additional observations';

  const validStatuses = categories.map((c) => `"${c.name}"`).join(", ");

  return `${flow.system_prompt || "You are an intelligent conversation router. Analyze conversations and classify them based on the rules provided."}

Your task is to analyze the following conversation and classify its current status.

CONVERSATION:
${conversationHistory}

CLASSIFICATION RULES:
${categoryRules}

VALID STATUS VALUES: ${validStatuses}

RESPOND EXCLUSIVELY IN JSON FORMAT WITH THIS EXACT STRUCTURE:
{
  "detected_status": "one of the valid status values above",
  "reasoning": "Technical explanation of why this status was chosen, referencing specific parts of the conversation",
  "extracted_info": {
      ${extractionFields}
  }
}

IMPORTANT:
- detected_status MUST be one of the valid status values listed above
- reasoning should be concise but specific
- extracted_info fields should be null if the information is not found in the conversation
- Respond ONLY with the JSON object, no additional text`;
}
