declare module 'openai' {
  export default class OpenAI {
    constructor(config: { apiKey: string });
    chat: {
      completions: {
        create: (params: {
          model: string;
          messages: Array<{
            role: string;
            content: string | Array<{
              type: string;
              text?: string;
              image_url?: {
                url: string;
                detail: string;
              };
            }>;
          }>;
          max_tokens: number;
          response_format: { type: string };
        }) => Promise<{
          choices: Array<{
            message: {
              content: string | null;
            };
          }>;
        }>;
      };
    };
  }
} 