import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from '@google/genai';
import { DailyLogs } from '../types';

const MODEL_NAME = 'gemini-3-flash-preview';

const DIET_INFO = `
Gastroparesis is a disorder in which the stomach takes too long to move food into the small intestines. This can cause nausea, vomiting, weight loss, poor appetite, reflux, bloating, abdominal discomfort, and early satiety.
The purpose of a diet for gastroparesis is to reduce the symptoms and maintain adequate nutrition.
GENERAL GUIDELINES:
- Drink enough fluids to prevent dehydration.
- Eat small, frequent meals (5-6 or more per day).
- Eat nutritious foods first.
- Reduce fat intake. Liquid fat is often better tolerated.
- Reduce fiber intake. High-fiber foods should be avoided.
- Chew foods well to a mashed potato or pudding consistency.
- Sit up while eating and for at least 1 hour after.
- If diabetic, keep blood sugar under control.
- Avoid alcohol.
- Light exercise like walking after meals is recommended.

FOODS TO CONSUME:
- Milk/Products: Fat-free or low-fat versions of milk, yogurt, pudding, cottage cheese, cheeses, sour cream.
- Soups: Made from fat-free/low-fat milk or broth.
- Fruits: Fruit juices, canned fruits without skins (applesauce, peaches, pears), ripe banana. Peeled cooked fruit.
- Meat/Substitutes: Eggs, egg whites, reduced-fat creamy peanut butter, poultry with skin removed, lean fish, lean beef, lean pork.
- Fats & Oils: Fat-free or low-fat salad dressings, mayonnaise; light margarine.
- Breads/Grains: White breads, low-fiber cereal (<= 2 gm fiber/serving), Cream of Wheat, grits, pasta, white rice, noodles, low-fat low-fiber crackers.
- Vegetables: Tomato juice, smooth tomato sauce, well-cooked vegetables without skins (acorn squash, beets, carrots, mushrooms, potatoes, spinach, summer squash).
- Condiments: Fat-free gravy, mustard, ketchup, barbeque sauce.
- Sweets: Fat-free/low-fat desserts like angel food cake, frozen yogurt, sorbet, gelatin.
- Beverages: Gatorade, diet soft drinks, coffee, tea, water, non-carbonated sugar-free drinks.

FOODS TO AVOID:
- Milk/Products: 2% or whole milk, heavy cream, regular/full-fat dairy products.
- Soups: Cream-based soups, soups with whole vegetables/skins.
- Fruits: All raw and dried fruits, canned fruits with skins, berries, figs, kiwi, coconut.
- Meat/Substitutes: Bacon, sausage, hot dogs, fatty meats, fish packed in oil, regular peanut butter, fibrous meats (steaks, roasts), dried beans.
- Fats & Oils: Butter, margarine, cooking oils in moderation. Regular salad dressings, mayonnaise, lard.
- Breads/Grains: Oatmeal, whole grain items, granola, dense starches like bagels, fried dough.
- Vegetables: All RAW vegetables, cooked vegetables with skins; broccoli, Brussels sprouts, cabbage, celery, corn, eggplant, onions, peas, peppers.
- Condiments: Gravies, meat sauces, regular mayonnaise, cream/butter sauces.
- Sweets: Cakes, pies, cookies, pastries, ice cream.
- Beverages: Alcoholic beverages, carbonated beverages if bloating.
- Miscellaneous: Nuts, seeds, popcorn, chunky nut butters, preserves.
`;

const setReminderFunctionDeclaration: FunctionDeclaration = {
  name: 'setReminder',
  parameters: {
    type: Type.OBJECT,
    description: 'Sets a reminder timer for the user at a device level.',
    properties: {
      action: {
        type: Type.STRING,
        description: 'The task the user needs to perform when the timer expires.',
      },
      minutes: {
        type: Type.NUMBER,
        description: 'The delay in minutes before the reminder should trigger.',
      },
    },
    required: ['action', 'minutes'],
  },
};

const getAIClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = JSON.stringify(error).toLowerCase();
      if (errorMessage.includes("503") || errorMessage.includes("overloaded") || errorMessage.includes("unavailable")) {
         if (i < retries - 1) {
            const backoff = delay * Math.pow(2, i) + Math.random() * 1000;
            console.log(`API is unavailable or overloaded, retrying in ${Math.round(backoff/1000)}s... (Attempt ${i + 1}/${retries - 1})`);
            await new Promise(res => setTimeout(res, backoff));
         }
      } else {
        throw error;
      }
    }
  }
  throw lastError;
};

export const geminiService = {
  setAssistantReminder: async (medication: string, minutes: number, action: string): Promise<any> => {
    try {
      const ai = getAIClient();
      const prompt = `I just took ${medication}. Please set a reminder for me to ${action} in ${minutes} minutes.`;
      
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          tools: [{ functionDeclarations: [setReminderFunctionDeclaration] }],
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      
      return response;
    } catch (error) {
      console.error("Error setting reminder with Gemini:", error);
      throw error;
    }
  },

  getDailySuggestions: async (): Promise<{ food: string; exercise: string; }> => {
    try {
      const ai = getAIClient();
      const prompt = `
        You are a helpful nutrition and fitness assistant for a person with gastroparesis (GP).
        Based on the provided dietary guidelines for GP, create a daily meal suggestion and a low-impact exercise suggestion.
        The user has bad knees and a recovering left wrist. 
        Please provide your response in a JSON format with two keys: "food" and "exercise".
        
        Here are the dietary guidelines:
        ---
        ${DIET_INFO}
        ---
      `;

      const generate = () => ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              food: { type: Type.STRING },
              exercise: { type: Type.STRING },
            },
            required: ["food", "exercise"],
          }
        }
      });
      
      const response: GenerateContentResponse = await withRetry(generate);
      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error fetching daily suggestions from Gemini:", error);
      throw error;
    }
  },

  getSymptomCorrelation: async (logs: DailyLogs): Promise<string> => {
    try {
      const ai = getAIClient();
      const recentLogs: { [date: string]: any } = {};
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      Object.keys(logs).forEach(dateStr => {
        if (new Date(dateStr) >= oneMonthAgo) {
          recentLogs[dateStr] = logs[dateStr];
        }
      });

      if (Object.keys(recentLogs).length === 0) {
        return "Not enough data for analysis.";
      }
      
      const prompt = `Analyze these logs for correlations. Not a medical diagnosis. Markdown format.\n${JSON.stringify(recentLogs, null, 2)}`;
      
      const generate = () => ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const response: GenerateContentResponse = await withRetry(generate);
      return response.text;
    } catch (error) {
      console.error("Error fetching symptom correlation from Gemini:", error);
      throw error;
    }
  },

  summarizeDoctorVisit: async (details: string): Promise<string> => {
    try {
      const ai = getAIClient();
      const prompt = `Summarize visit in max 20 words: "${details}"`;
      const generate = () => ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });
      const response: GenerateContentResponse = await withRetry(generate);
      return response.text.trim();
    } catch (error) {
      return "Summary unavailable.";
    }
  }
};