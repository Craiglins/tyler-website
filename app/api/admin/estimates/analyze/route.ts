import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { images, textDescription } = await request.json();

    let analysis = '';
    let estimatedAmount = null;

    // Prepare the system message
    const systemMessage = {
      role: "system",
      content: "You are an expert in junk removal and hauling services. Analyze the provided information and generate a detailed estimate including the total cost. Consider factors like item size, weight, disposal fees, and labor. Format your response as JSON with 'description' and 'estimatedAmount' fields."
    };

    // Prepare the user message based on available inputs
    let userMessage;
    if (images && images.length > 0) {
      userMessage = {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze these images and provide an estimate for junk removal/hauling services."
          },
          ...images.map((image: string) => ({
            type: "image_url",
            image_url: {
              url: image,
              detail: "high"
            }
          }))
        ]
      };
    } else if (textDescription) {
      userMessage = {
        role: "user",
        content: textDescription
      };
    } else {
      return NextResponse.json(
        { error: 'No images or text description provided' },
        { status: 400 }
      );
    }

    // Make the API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [systemMessage, userMessage],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const estimateResponse = JSON.parse(content);
    analysis = estimateResponse.description;
    estimatedAmount = estimateResponse.estimatedAmount;

    return NextResponse.json({
      analysis,
      estimatedAmount,
    });
  } catch (error) {
    console.error('Error analyzing estimate:', error);
    return NextResponse.json(
      { error: 'Failed to analyze estimate' },
      { status: 500 }
    );
  }
} 