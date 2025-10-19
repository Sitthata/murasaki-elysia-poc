import Elysia, { t } from "elysia";
import { prisma } from "src";
import OpenAI from "openai";
import * as fs from "fs/promises";
import * as path from "path";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_AI_KEY,
});

interface EvaluationResult {
  score: number;
  reasoning: string;
  suggestions: string;
  response_time: number;
}

interface TestResults {
  model: string;
  prompt: string;
  results: EvaluationResult[];
  avg_response_time: number;
  avg_score: number;
  score_std_dev: number;
  min_score: number;
  max_score: number;
  score_variance: number;
}

async function getChatCompletion(prompt: string, model: string) {
  const systemPrompt = `
    You are a professor of prompt engineering who grades strictly using the given rubric.

    Inputs:
    - rubric: defines each criterion and its scoring range.
    - answer: the student's prompt or response to evaluate.

    Instructions:
    1. Read and fully understand the rubric before judging.
    2. Evaluate the answer only according to the rubric’s exact criteria.
    3. For each criterion, give a clear, short reason and its numeric score, following the rubric wording precisely.
    4. Do NOT invent new criteria, terms, or attributes.
    5. Be honest — weak answers must get low scores with brief justification.
    6. Do NOT include any total score in your reasoning (the system will calculate it).
    7. Output must be valid JSON only, no text or markdown outside of it.

    JSON structure:
    {
      "reasoning": string,
      "suggestions": string
    }

    Formatting rules:
    - “reasoning”: concise, 2–5 sentences maximum. Include each rubric part inline with its score, e.g.
      "Clarity 2/3: goal mostly clear but lacks task details. Specificity 1/2: vague output format. Constraints 2/2: clear limits given."
    - “suggestions”: one short, actionable improvement (≤20 words) focused on the weakest rubric area.
    - Output must be a single-line valid JSON object with no trailing commas, no markdown, no code blocks.

    Edge behavior:
    If rubric or answer is missing:
    {"reasoning":"Rubric or answer missing.","suggestions":"Provide both rubric and answer."}
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
    model: model,
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
    reasoning_effort: "minimal",
    response_format: { type: "json_object" },
  });
  return completion.choices[0].message.content;
}

async function runConsistencyTest(
  prompt: string,
  model: string,
  iterations: number = 10,
): Promise<TestResults> {
  const results: EvaluationResult[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    const response = await getChatCompletion(prompt, model);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response) {
      const parsed = JSON.parse(response);
      results.push({
        score: getScore(parsed.reasoning),
        reasoning: parsed.reasoning,
        suggestions: parsed.suggestions,
        response_time: responseTime,
      });
    }
  }

  // Calculate statistics
  const scores = results.map((r) => r.score);
  const responseTimes = results.map((r) => r.response_time);

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const avgResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  // Calculate standard deviation
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) /
    scores.length;
  const stdDev = Math.sqrt(variance);

  return {
    model,
    prompt,
    results,
    avg_response_time: Math.round(avgResponseTime),
    avg_score: Math.round(avgScore * 100) / 100,
    score_std_dev: Math.round(stdDev * 100) / 100,
    min_score: Math.min(...scores),
    max_score: Math.max(...scores),
    score_variance: Math.round(variance * 100) / 100,
  };
}

function getScore(reasoning: string): number {
  const regex = /(\d+)\/\d+/g;
  const matches = [...reasoning.matchAll(regex)];
  const totalScores = matches
    .map((match) => parseInt(match[1]))
    .reduce((a, b) => a + b, 0);

  return totalScores;
}

async function saveTestResults(testResults: TestResults): Promise<string> {
  // Create test-results directory if it doesn't exist
  const resultsDir = path.join(process.cwd(), "test-results");
  try {
    await fs.access(resultsDir);
  } catch {
    await fs.mkdir(resultsDir, { recursive: true });
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
  const sanitizedModel = testResults.model.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${sanitizedModel}_${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);

  // Save to file
  await fs.writeFile(filepath, JSON.stringify(testResults, null, 2), "utf-8");

  return filepath;
}

export const routes = new Elysia({ prefix: "/api" })
  .post(
    "/verify",
    async ({ body }) => {
      const response = await getChatCompletion(body.prompt, body.model);
      return response;
    },
    {
      body: t.Object({
        prompt: t.String(),
        model: t.String(),
      }),
    },
  )
  .post(
    "/verify/test",
    async ({ body }) => {
      const testResults = await runConsistencyTest(
        body.prompt,
        body.model,
        body.iterations || 10,
      );

      // Save results to JSON file
      // const filepath = await saveTestResults(testResults);

      return {
        ...testResults,
        // saved_to: filepath,
      };
    },
    {
      body: t.Object({
        prompt: t.String(),
        model: t.String(),
        iterations: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
      }),
    },
  );
