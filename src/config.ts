/**
 * Configuration for the application
 */
export const config = {
  // OpenAI API key from environment variable
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // API model to use
  openaiModel: 'gpt-4o',

  // Default data storage path
  dataStoragePath: './data',
};
