const apiKey = process.env["PERPLEXITY_API_KEY"];

interface Message {
  role: string;
  content: string;
}

export async function getWebSearchCompletion(messages: Message[]) {
  if (!apiKey) {
    throw new Error("Perplexity API key not configured");
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages,
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        frequency_penalty: 1,
        presence_penalty: 0,
        search_domain_filter: [], // Allow all domains
        search_recency_filter: "month",
        return_citations: true,
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from Perplexity');
    }

    // Return both the content and citations if available
    return {
      response: data.choices[0].message.content,
      citations: data.citations || []
    };
  } catch (error) {
    console.error("Perplexity API Error:", error);
    throw error;
  }
}
