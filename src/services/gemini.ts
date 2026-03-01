import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EvaluationResult {
  overall_score: number;
  dimension_scores: {
    technical_depth: number;
    relevance: number;
    communication: number;
    problem_solving: number;
    confidence: number;
  };
  strengths: string[];
  weaknesses: string[];
  improved_answer: string;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  type: 'behavioral' | 'technical' | 'situational';
  hint?: string;
}

export interface QuizQuestion {
  id: number;
  keyword: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export type InterviewType = 'behavioral' | 'technical' | 'mixed';

export const generateQuestions = async (
  resumeText: string, 
  role: string, 
  type: InterviewType = 'mixed'
): Promise<InterviewQuestion[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Role: ${role}
      Interview Type: ${type}
      Resume Content:
      ${resumeText}
      
      Task: Generate 5 personalized interview questions for this candidate. Include a 'hint' for each question that provides a brief outline of a perfect answer.
    `,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction: `You are an expert AI Interview Coach. Your goal is to generate 5 high-quality, realistic, and role-specific interview questions based directly on the provided resume content and the target role.
      
      Interview Type requested: ${type}.
      - If 'behavioral', focus on past experiences and soft skills.
      - If 'technical', focus on hard skills, tools, and architectural knowledge.
      - If 'mixed', provide a balanced set.

      Guidelines:
      1. Analyze the candidate's experience, skills, and projects.
      2. Create questions that bridge their past experience with the requirements of a ${role} position.
      3. Return the questions as a JSON array of objects with 'question', 'type', and 'hint' fields.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['behavioral', 'technical', 'situational'] },
            hint: { type: Type.STRING, description: "A brief outline or key points for a perfect answer." }
          },
          required: ['question', 'type', 'hint']
        },
      },
    },
  });

  const questions: any[] = JSON.parse(response.text || "[]");
  return questions.map((q, i) => ({ id: i + 1, ...q }));
};

export const generateQuiz = async (resumeText: string): Promise<QuizQuestion[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Resume Content: ${resumeText}`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction: `Extract 5 key technical terms or concepts from this resume and generate a multiple-choice quiz. 
      Each question should test the candidate's knowledge of a keyword found in their own resume.
      Return a JSON array of objects with: 'keyword', 'question', 'options' (array of 4), 'correctAnswer' (string matching one option), and 'explanation'.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ['keyword', 'question', 'options', 'correctAnswer', 'explanation']
        }
      }
    }
  });

  const quiz: any[] = JSON.parse(response.text || "[]");
  return quiz.map((q, i) => ({ id: i + 1, ...q }));
};

export const evaluateAnswer = async (
  resumeText: string,
  role: string,
  question: string,
  answer: string,
  voiceAnalysis?: string
): Promise<EvaluationResult> => {
  const prompt = `
Resume:
${resumeText}
Job Role:
${role}
Interview Question:
${question}
Candidate Answer:
${answer}
${voiceAnalysis ? `Voice Analysis: ${voiceAnalysis}` : ""}
Evaluate now.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction: `You are an expert AI Interview Coach. Evaluate the candidate's answer deeply and fairly. Provide structured, constructive feedback and score performance across multiple dimensions.
Analyze across these dimensions (score each 0–100):
* Technical Depth
* Relevance to Resume
* Communication Clarity
* Problem Solving
* Confidence (based only on text signals unless voice data provided)
Return evaluation in JSON format:
{
  "overall_score": number,
  "dimension_scores": {
    "technical_depth": number,
    "relevance": number,
    "communication": number,
    "problem_solving": number,
    "confidence": number
  },
  "strengths": ["point1", "point2"],
  "weaknesses": ["point1", "point2"],
  "improved_answer": "Rewrite the candidate’s answer in a stronger way."
}
Feedback must be honest but encouraging, specific, and actionable. Never be vague. Never give generic praise. Act like a senior hiring manager at a top tech company.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overall_score: { type: Type.NUMBER },
          dimension_scores: {
            type: Type.OBJECT,
            properties: {
              technical_depth: { type: Type.NUMBER },
              relevance: { type: Type.NUMBER },
              communication: { type: Type.NUMBER },
              problem_solving: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
            },
            required: ["technical_depth", "relevance", "communication", "problem_solving", "confidence"],
          },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          improved_answer: { type: Type.STRING },
        },
        required: ["overall_score", "dimension_scores", "strengths", "weaknesses", "improved_answer"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

// Fast AI responses using gemini-3-flash-preview
export const getFastResponse = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });
  return response.text || "";
};

// AI Chatbot using gemini-3.1-pro-preview
export const startChat = (systemInstruction: string) => {
  return ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: { 
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    },
  });
};

// Audio Transcription using gemini-3-flash-preview
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "audio/wav",
          data: base64Audio,
        },
      },
      { text: "Transcribe this audio accurately." },
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });
  return response.text || "";
};

// TTS using gemini-2.5-flash-preview-tts
export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};
