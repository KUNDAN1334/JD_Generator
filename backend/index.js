require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Check if API key is loaded
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

app.post('/api/generate-jd', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const geminiPrompt = `Generate a professional, engaging, and inclusive job description for the following role: "${prompt}". The job description must include:
- Job Title: Clear and specific.
- Company Overview: A brief, enthusiastic description of the company, its mission, and culture (assume an innovative tech company named "InnovateTech").
- Job Summary: A concise overview of the role’s purpose and impact.
- Responsibilities: 3-5 specific, action-oriented duties using strong verbs.
- Qualifications: 4-5 must-have requirements (education, experience, skills).
- Preferred Skills: 3-5 nice-to-have skills or certifications.
- Benefits: Highlight competitive perks (e.g., health insurance, remote work, professional development).
- Location: Specify if remote, hybrid, or on-site (e.g., "Remote or San Francisco, CA").
- Salary Range: Include a transparent range (e.g., "$100,000 - $140,000 annually") unless otherwise specified.
- Application Instructions: Clear steps to apply (e.g., email or link).
Format the JD in markdown with clear headings, bullet points for lists, and enthusiastic yet professional language. Ensure it is fit in one page pdf and keep it clear and concise  and the tone is inclusive and avoids bias.`

    // Use the updated model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content
    const result = await model.generateContent(geminiPrompt);
    const response = await result.response;
    const jobDescription = response.text();

    res.json({ jobDescription });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate job description' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
