import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/constants"; // Import the key

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- FEATURE 1: CHATBOT ---
export const getFashionAdvice = async (fullHistory: any[], userMessage: string) => {
  const systemPrompt = `
    You are a men's fashion expert stylist. 
    Tone: Cool, concise, "GQ Magazine" style.
    Rules: 
    1. ONLY answer questions about men's fashion, grooming, or style. 
    2. If asked about anything else (weather, politics, coding), politely refuse.
    3. Keep advice practical and trendy.
  `;

  // FIX: Remove the last message from history because we are about to send it as 'userMessage'
  // This prevents the "User -> User" error.
  const validHistory = fullHistory.slice(0, -1);

  try {
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...validHistory,
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    // If the error mentions API Key, throw a clear message
    if (error.message?.includes("API key")) {
        throw new Error("Invalid API Key. Check gemini.ts");
    }
    throw error;
  }
};

// --- FEATURE 2: OUTFIT SUGGESTER ---
export const generateOutfit = async (closetItems: any[], occasion: string) => {
  if (closetItems.length === 0) return null;

  const inventoryList = closetItems.map(item => 
    `ID: ${item.id} | Type: ${item.category} | Desc: ${item.description || item.category}`
  ).join("\n");

  const prompt = `
    I have these clothes in my closet:
    ${inventoryList}

    TASK: Pick the best outfit for this occasion: "${occasion}".
    RULES:
    1. Select 1 Top, 1 Bottom, and optionally Shoes/Accessories.
    2. Return ONLY a JSON object.
    
    Format:
    {
      "selectedIds": ["id_1", "id_2"],
      "reasoning": "Reason here..."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Outfit Error:", error);
    return null;
  }
};export const analyzeBodyShape = async (measurements: any) => {
  const prompt = `
    Analyze this man's body measurements to determine his Body Shape:
    - Height: ${measurements.height} cm
    - Weight: ${measurements.weight} kg
    - Chest: ${measurements.chest} cm
    - Waist: ${measurements.waist} cm
    - Shoulders: ${measurements.shoulders} cm

    TASK:
    1. Identify his Body Shape (e.g., Inverted Triangle, Rectangle, Oval, Trapezoid, Triangle).
    2. Give 3 specific "Do's" and 3 "Don'ts" for styling this specific shape.

    Return ONLY JSON:
    {
      "shape": "Trapezoid",
      "description": "Your shoulders are broad compared to your waist...",
      "advice": {
        "dos": ["Wear vertical stripes", "Structured jackets"],
        "donts": ["Horizontal stripes on belly", "Baggy pants"]
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Body Analysis Error:", error);
    return null;
  }
};