const apiKey = process.env["PERPLEXITY_API_KEY"];

interface Message {
  role: "system" | "user" | "assistant";
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
        'Accept': 'application/json',
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
        return_citations: true,
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Perplexity API Error Response:', responseData);
      throw new Error(
        responseData.error?.message || 
        responseData.error || 
        `Perplexity API error: ${response.statusText}`
      );
    }

    if (!responseData?.choices?.[0]?.message?.content) {
      console.error('Invalid Perplexity Response Format:', responseData);
      throw new Error('Invalid response format from Perplexity');
    }

    // Return both the content and citations if available
    return {
      response: responseData.choices[0].message.content,
      citations: responseData.citations || []
    };
  } catch (error) {
    console.error("Perplexity API Error Details:", error);
    throw error;
  }
}