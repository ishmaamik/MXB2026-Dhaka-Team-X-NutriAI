import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ExtractedItem {
  name: string;
  quantity?: number;
  unit?: string;
  confidence: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  extractedItems: ExtractedItem[];
}

export class OCRService {
  async extractTextFromImage(imageUrl: string): Promise<OCRResult> {
    try {
      console.log(
        '🔍 [OCRService] Starting Groq Vision extraction for:',
        imageUrl,
      );

      if (!process.env.GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and extract all food items, ingredients, or grocery items you can see. 
                
                Please return a JSON object with:
                1. "text" - the raw text you can see in the image
                2. "items" - an array of food items found, each with:
                   - "name": the item name
                   - "quantity": numerical amount if visible (default 1)
                   - "unit": unit of measurement if visible (default "pcs")
                
                Focus on:
                - Food products and their names
                - Quantities, weights, or counts if visible
                - Ingredients lists
                - Recipe items
                - Grocery receipts
                - Food packaging text
                
                Return only valid JSON, no markdown formatting.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_completion_tokens: 1024,
      });

      const content = chatCompletion.choices[0]?.message?.content || '';
      console.log('🤖 [OCRService] Groq raw response:', content);

      // Try to parse JSON response
      let extractedData;
      try {
        extractedData = JSON.parse(content);
      } catch (parseError) {
        console.log(
          '📝 [OCRService] Failed to parse JSON, falling back to text extraction',
        );
        // Fallback: extract items from plain text
        extractedData = {
          text: content,
          items: this.parseItemsFromText(content),
        };
      }

      // Convert to our interface format
      const extractedItems: ExtractedItem[] = (extractedData.items || [])
        .map((item: any) => ({
          name: this.cleanItemName(item.name || ''),
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          unit: item.unit || 'pcs',
          confidence: 0.95, // Groq Vision has high confidence
        }))
        .filter((item: ExtractedItem) => item.name.length > 0);

      const result = {
        text: extractedData.text || content,
        confidence: 0.95,
        extractedItems,
      };

      console.log('✅ [OCRService] Extraction complete:', result);
      return result;
    } catch (error) {
      console.error('❌ [OCRService] Groq Vision extraction failed:', error);

      // Fallback to basic text parsing if Groq fails
      return {
        text: '',
        confidence: 0,
        extractedItems: [],
      };
    }
  }

  private parseItemsFromText(
    text: string,
  ): Array<{ name: string; quantity?: number; unit?: string }> {
    const items: Array<{ name: string; quantity?: number; unit?: string }> = [];

    // Food-related keywords to help identify food items
    const foodKeywords = [
      'apple',
      'banana',
      'orange',
      'milk',
      'bread',
      'cheese',
      'chicken',
      'beef',
      'pork',
      'rice',
      'pasta',
      'tomato',
      'potato',
      'onion',
      'carrot',
      'broccoli',
      'spinach',
      'egg',
      'butter',
      'yogurt',
      'cereal',
      'flour',
      'sugar',
      'salt',
      'pepper',
      'oil',
      'vinegar',
      'garlic',
      'lemon',
      'lime',
      'berry',
      'grape',
      'melon',
      'fish',
      'salmon',
      'tuna',
      'shrimp',
      'beans',
      'lentils',
      'nuts',
      'seeds',
    ];

    // Split text into lines and process each
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.length < 2) continue;

      // Look for quantity patterns (numbers followed by units)
      const quantityMatch = trimmedLine.match(
        /(\d+(?:\.\d+)?)\s*(kg|g|lb|lbs|oz|ml|l|cups?|tbsp|tsp|pieces?|pcs?|items?)/i,
      );

      // Look for food keywords
      const containsFoodKeyword = foodKeywords.some(keyword =>
        trimmedLine.toLowerCase().includes(keyword.toLowerCase()),
      );

      if (quantityMatch || containsFoodKeyword) {
        // Clean the item name
        let itemName = trimmedLine
          .replace(/^\d+[\.\-\)]\s*/, '') // Remove list numbers
          .replace(/\$\d+[\.\d]*/, '') // Remove prices
          .replace(
            /\d+(?:\.\d+)?\s*(?:kg|g|lb|lbs|oz|ml|l|cups?|tbsp|tsp|pieces?|pcs?|items?)/gi,
            '',
          ) // Remove quantities
          .trim();

        if (itemName && itemName.length > 1) {
          items.push({
            name: this.cleanItemName(itemName),
            quantity: quantityMatch ? parseFloat(quantityMatch[1]) : 1,
            unit: quantityMatch ? quantityMatch[2] : 'pcs',
          });
        }
      }
    }

    return items.slice(0, 20); // Limit to prevent overwhelming
  }

  private cleanItemName(name: string): string {
    return name
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()); // Title case
  }
}

export const ocrService = new OCRService();
