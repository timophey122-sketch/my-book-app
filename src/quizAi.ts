import { firebaseConfig } from './firebase';

export type GeneratedQuizQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

const quizSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          options: {
            type: 'array',
            minItems: 5,
            maxItems: 5,
            items: { type: 'string' },
          },
          correctIndex: { type: 'integer', minimum: 0, maximum: 4 },
        },
        required: ['prompt', 'options', 'correctIndex'],
      },
    },
  },
  required: ['questions'],
};

const MODEL_NAMES = ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite'];

async function requestQuiz(prompt: string, model: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(
      `https://firebasevertexai.googleapis.com/v1beta/projects/${firebaseConfig.projectId}/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Firebase-AppId': firebaseConfig.appId,
          'X-Goog-Api-Key': firebaseConfig.apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 2600,
            responseMimeType: 'application/json',
            responseJsonSchema: quizSchema,
          },
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error(`Firebase AI ${response.status}: ${await response.text()}`);
    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('');
    if (!text) throw new Error('Firebase AI returned an empty response');
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

function validateQuestion(value: unknown): GeneratedQuizQuestion | null {
  if (!value || typeof value !== 'object') return null;
  const question = value as Partial<GeneratedQuizQuestion>;
  if (typeof question.prompt !== 'string' || question.prompt.trim().length < 8) return null;
  if (!Array.isArray(question.options) || question.options.length !== 5) return null;
  if (question.options.some(option => typeof option !== 'string' || option.trim().length < 1)) return null;
  if (new Set(question.options.map(option => option.trim().toLocaleLowerCase())).size !== 5) return null;
  if (!Number.isInteger(question.correctIndex) || question.correctIndex! < 0 || question.correctIndex! > 4) return null;
  return {
    prompt: question.prompt.trim(),
    options: question.options.map(option => option.trim()),
    correctIndex: question.correctIndex!,
  };
}

export async function generateBookQuiz(title: string, author: string, language: string, excludedQuestions: string[] = []): Promise<GeneratedQuizQuestion[]> {
  const attemptId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const exclusions = excludedQuestions.length
    ? `\nDo not reuse or closely paraphrase any of these questions from earlier attempts:\n${excludedQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}`
    : '';
  const prompt = `Create a reading-verification quiz for the book below.

Book title: ${title}
Author: ${author}
Answer language / locale: ${language}
Unique attempt ID: ${attemptId}

Return exactly 5 new questions written specifically for this attempt. Each question must have exactly 5 distinct answer options and exactly one fully correct option. Test concrete plot details, character actions, objects, places, causes, consequences, or memorable events. Avoid generic questions such as "Who is the main character?". The four wrong options must be plausible but unambiguously wrong for someone who read the complete book. Never reveal the correct answer inside the question text. If several books have a similar title, use the author to identify the work. Use age-appropriate wording and do not include sexual or graphic details.${exclusions}`;
  let lastError: unknown;
  for (const model of MODEL_NAMES) {
    try {
      const parsed = await requestQuiz(prompt, model) as { questions?: unknown[] };
      if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5) throw new Error('Invalid quiz response');
      const questions = parsed.questions.map(validateQuestion);
      if (questions.some(question => question === null)) throw new Error('Invalid quiz question');
      const excluded = new Set(excludedQuestions.map(question => question.trim().toLocaleLowerCase()));
      if ((questions as GeneratedQuizQuestion[]).some(question => excluded.has(question.prompt.toLocaleLowerCase()))) throw new Error('Repeated quiz question');
      return questions as GeneratedQuizQuestion[];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Quiz generation failed');
}
