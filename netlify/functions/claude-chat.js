// Netlify Function to proxy chat messages to Claude API
// Uses CLAUDE_API_KEY_4 environment variable (set in Netlify dashboard)

const SYSTEM_PROMPT = `You are the A1 Diagnosis AI Assistant. A1 Diagnosis is developing the first blood-based AMD (Age-related Macular Degeneration) risk assessment test with 94-95% accuracy.

Key facts:
- Founded by Dr. Mustafa Ozgul, UC Irvine AMD researcher (6 years)
- Co-founder: Dr. Murat Baday, Stanford & Synapses Ventures
- Market: $42.3B TAM, 169M Americans aged 35+
- Business model: Blood test → AI analysis → risk report, $250/test
- Inspired by Exact Sciences (Cologuard) success model ($9.9B market cap)
- FDA pathway: De Novo classification (Class II), 150-day review
- Team: 8 experts, 108+ years combined experience, $115M+ proven funding
  - Dr. Mustafa Ozgul - Founder & CEO, UC Irvine AMD Researcher
  - Dr. Murat Baday - Co-founder, Stanford & Synapses Ventures ($6.1M Series A)
  - Daniel Chatelain - Strategic Business Advisor, BayPay Forum Founder
  - Prof. Prashanth Asuri - Health Innovation Advisor, Santa Clara University
  - Prof. Ramasamy Paulmurugan - Stanford Professor, $10M+ NIH, 203+ Publications
  - Danny Seth - Neurology Diagnostics Expert, Redwood Bio CEO, Harvard MBA
  - Dr. Chirag Patel - Neuro-Oncology Specialist, MD Anderson Cancer Center
  - Prof. Emre Araci - Technology Advisor, Santa Clara University
- Phase 1: Pre-clinical validation, $1.25M investment, 18 months
- Contact: ozgul@A1Diagnosis.com — Dr. Mustafa Ozgul (Founder & CEO)
- Website: a1diagnosis.com

Be helpful, concise, and professional. Answer questions about AMD, the blood test, the company, investment opportunities, and the team. If you don't know something specific, direct them to contact Dr. Ozgul at ozgul@A1Diagnosis.com.`;

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const apiKey = process.env.CLAUDE_API_KEY_4;
    if (!apiKey) {
        console.error('CLAUDE_API_KEY_4 environment variable not set');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Chat service is not configured' })
        };
    }

    try {
        const { message, conversationHistory } = JSON.parse(event.body);

        // Validate message
        if (!message || typeof message !== 'string') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        if (message.length > 2000) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Message must be 2000 characters or less' })
            };
        }

        // Build messages array with conversation history
        const messages = [];

        if (Array.isArray(conversationHistory)) {
            // Limit to last 10 entries
            const history = conversationHistory.slice(-10);
            for (const entry of history) {
                if (entry.role && entry.content &&
                    (entry.role === 'user' || entry.role === 'assistant') &&
                    typeof entry.content === 'string') {
                    messages.push({
                        role: entry.role,
                        content: entry.content.slice(0, 2000)
                    });
                }
            }
        }

        // Add current message
        messages.push({ role: 'user', content: message });

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                system: SYSTEM_PROMPT,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API error:', response.status, errorText);
            return {
                statusCode: 502,
                body: JSON.stringify({ error: 'Failed to get response from AI' })
            };
        }

        const data = await response.json();
        const reply = data.content?.[0]?.text || 'I apologize, I was unable to generate a response. Please try again.';

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ reply })
        };

    } catch (error) {
        console.error('Chat function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An unexpected error occurred' })
        };
    }
};
