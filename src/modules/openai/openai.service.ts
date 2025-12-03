import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(messages: any[]) {
    try {
      console.log('🤖 Sending to OpenAI:', JSON.stringify(messages, null, 2));
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });
      const content = response.choices[0]?.message?.content;
      console.log('🤖 OpenAI response:', content ? content.substring(0, 100) + '...' : 'null');
      return content || 'Извините, не удалось получить ответ от ИИ.';
    } catch (error) {
      console.error('❌ OpenAI error:', error);
      return 'Извините, произошла ошибка при обращении к ИИ.';
    }
  }

  async analyzeImage(imageUrl: string, prompt?: string): Promise<string> {
    try {
      const messages: any[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt || 'Опиши это изображение подробно. Расскажи, что на нем изображено, какие объекты, люди, настроение, цвета и т.д.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low'
              }
            }
          ]
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 1000,
        temperature: 0.3
      });

      return response.choices[0].message.content || 'Не удалось проанализировать изображение';
    } catch (error) {
      console.error('Error analyzing image:', error);
      return 'Извините, произошла ошибка при анализе изображения.';
    }
  }

  async extractTextFromImage(imageUrl: string): Promise<string> {
    try {
      const messages: any[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Извлеки весь текст с этого изображения. Верни только текст, без дополнительных комментариев.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 2000,
        temperature: 0.1 // Lower temperature for more accurate OCR
      });

      return response.choices[0].message.content || 'Текст не найден';
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return 'Извините, произошла ошибка при извлечении текста.';
    }
  }

  async transcribeAudio(audioUrl: string) {
    // For voice messages - would need actual audio file
    // This is a placeholder for future implementation
    return 'Транскрибация голосовых сообщений пока не реализована';
  }
}