import Elysia, { t } from "elysia";
import { prisma } from "src";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_AI_KEY,
});

async function getChatCompletion(prompt: string) {
  const systemPrompt = `
        You are an expert evaluator. Your task is to assess a user's text based on a given rubric.
        Provide a score and a concise justification for that score.
        You MUST respond in a valid JSON format. Do not include any text outside of the JSON object.

        The JSON object must have the following structure:
        {
          "score": number, // A numerical score from 1-10
          "reasoning": string, // A brief explanation for the score, based on the rubric.
          "suggestions": string // One concrete suggestion for improvement.
        }
      `;
  const promptEvaluationRubric = `
Rubric: Evaluating AI Prompts for Consistency and Skill Preservation (Max Score: 10)

This rubric assesses a user's prompt based on four weighted criteria. The total score is out of 10. The weighting emphasizes that Clarity and Collaborative Framing are the most crucial elements.

---
**Criterion 1: Clarity & Specificity (Max Score: 3)**
**Objective:** The prompt should be unambiguous and precise, leaving no room for misinterpretation by the AI.

* **Excellent (Score: 3):** The prompt is crystal clear. It uses precise language, defines all key terms, and explicitly states the desired outcome.
* **Good (Score: 2):** The prompt is generally clear but contains minor ambiguities or relies on the AI to infer some meaning.
* **Needs Improvement (Score: 1):** The prompt is vague, overly broad, or confusing, forcing the AI to make significant assumptions.

---
**Criterion 2: Contextual Sufficiency (Max Score: 2)**
**Objective:** The prompt must provide all necessary background information for the AI to perform the task effectively.

* **Excellent (Score: 2):** The prompt includes all relevant context, such as the user's goal, the target audience, and specific examples.
* **Good (Score: 1):** The prompt provides some background but is missing key details, requiring the AI to make assumptions.
* **Needs Improvement (Score: 0):** The prompt lacks critical context, leading to a generic or incorrect response.

---
**Criterion 3: Constraint & Format Definition (Max Score: 2)**
**Objective:** The prompt should guide the AI on the structure, style, and boundaries of the desired output.

* **Excellent (Score: 2):** The prompt clearly defines the desired output format (e.g., JSON, list), tone, length, and what to include or exclude.
* **Good (Score: 1):** The prompt gives some general guidance (e.g., "be concise") but lacks specific formatting rules.
* **Needs Improvement (Score: 0):** The prompt gives the AI total freedom over the output, leading to inconsistent results.

---
**Criterion 4: Collaborative Framing & Skill Preservation (Max Score: 3)**
**Objective:** The prompt should use the AI as a tool to augment the user's thinking process, not replace it.

* **Excellent (Score: 3):** The prompt is framed as a collaboration. It asks the AI to critique the user's work, explain a concept, or break down a problem into steps, empowering the user. (e.g., "Critique my approach...").
* **Good (Score: 2):** The prompt asks for a partial solution or a template that the user must complete, still requiring significant cognitive effort. (e.g., "Give me a function template...").
* **Needs Improvement (Score: 1):** The prompt directly asks for the complete, final answer, outsourcing the entire problem-solving process. (e.g., "Write the complete code...").
`;
  const completion = await openai.chat.completions.create({
    model: "qwen/qwen2.5-vl-32b-instruct:free",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Please evaluate the following text:\n\n---TEXT---\n${prompt}\n\n---RUBRIC---\n${promptEvaluationRubric}`,
      },
    ],
    reasoning_effort: "high",
    response_format: { type: "json_object" },
  });
  return completion.choices[0].message.content;
}

export const routes = new Elysia({ prefix: "/api" }).post(
  "/verify",
  async ({ body }) => {
    console.log("Hit me");
    const response = await getChatCompletion(body.prompt);
    return response;
  },
  {
    body: t.Object({
      prompt: t.String(),
    }),
  }
);
