import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not set in the environment variables.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function checkModel(modelName: string) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log(`Model ${modelName} is available.`);
  } catch (error) {
    console.error(`Error checking model ${modelName}:`, error);
  }
}

// Check for a specific model
checkModel('gemini-1.0-pro'); 