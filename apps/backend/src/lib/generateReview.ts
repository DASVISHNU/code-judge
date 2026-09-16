import { GoogleGenAI } from "@google/genai";

const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY})

export async function generateReview(code:string,
    language:string,
    output:string|null
) {
    const prompt=`YOu are a reviewing a ${language}code submission from a coding platform.
    code:
    \`\`\`${language}
    ${code}
    \`\`\`
${output ? `Program output/error:\n${output}` : "The code has not been run yet."}

Give a short, encouraging review (3-5 sentences). If there's a bug, explain what's wrong and why, but do not just hand over a corrected version — help the user understand the mistake so they can fix it themselves.
`
const response=await ai.models.generateContent({
    model:"gemini-2.5-flash",
    contents:prompt
});

return response.text;
}