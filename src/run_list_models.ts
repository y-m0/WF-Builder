import { generateWorkflow, listAvailableModels } from './features/chatbot-gemini/services/gemini';

async function main() {
  console.log("VITE_GEMINI_API_KEY is set:", !!import.meta.env.VITE_GEMINI_API_KEY);
  console.log("\n--- Calling listAvailableModels ---");
  await listAvailableModels();
  console.log("\n--- Attempting generateWorkflow with 'gemini-pro' ---");
  const samplePrompt = "Briefly explain what a language model is.";
  try {
    console.log(`Attempting to generate content with prompt: "${samplePrompt}"`);
    const workflow = await generateWorkflow(samplePrompt);
    console.log("generateWorkflow call succeeded. Response:");
    console.log(JSON.stringify(workflow, null, 2));
  } catch (error) {
    console.error("generateWorkflow call failed:");
    // Log the full error object if possible, as it might contain more details
    // than just error.message, especially for API errors.
    if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        if ('stack' in error) {
            console.error(`Error stack: ${error.stack}`);
        }
        // Some API errors might have additional properties like 'details' or 'response'
        if ('response' in error && error.response) {
             console.error('Error response:', JSON.stringify((error as any).response, null, 2));
        } else {
            console.error('Full error object:', JSON.stringify(error, null, 2));
        }
    } else {
        console.error('An unexpected error type was thrown:', error);
    }
  }
}

main().catch(e => {
  console.error("Unhandled error in main:", e);
});
