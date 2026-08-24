import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { firebaseApp } from './firebase';

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

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const quizModel = getGenerativeModel(ai, {
  model: 'gemini-3.5-flash-lite',
  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 2200,
    responseMimeType: 'application/json',
    responseJsonSchema: quizSchema,
  },
});

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

export async function generateBookQuiz(title: string, author: string, language: string): Promise<GeneratedQuizQuestion[]> {
  const prompt = `Create a reading-verification quiz for the book below.

Book title: ${title}
Author: ${author}
Answer language / locale: ${language}

Return exactly 5 questions. Each question must have exactly 5 distinct answer options and exactly one fully correct option. Test concrete plot details, character actions, objects, places, causes, consequences, or memorable events. Avoid generic questions such as "Who is the main character?". The four wrong options must be plausible but unambiguously wrong for someone who read the complete book. Never reveal the correct answer inside the question text. If several books have a similar title, use the author to identify the work. Use age-appropriate wording and do not include sexual or graphic details.`;
  const result = await quizModel.generateContent(prompt);
  const parsed = JSON.parse(result.response.text()) as { questions?: unknown[] };
  if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5) throw new Error('Invalid quiz response');
  const questions = parsed.questions.map(validateQuestion);
  if (questions.some(question => question === null)) throw new Error('Invalid quiz question');
  return questions as GeneratedQuizQuestion[];
}
