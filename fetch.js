export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          {
            role: "user",
            content: `Search for and read the startup website at: ${url}
Also search for more context about this startup: "${url} startup about funding team".

Return a comprehensive summary of:
1. What this startup does (product, problem solved, target customers)
2. Their business model
3. Their target market and geography  
4. Any funding information visible
5. Team information
6. Any traction or metrics mentioned
7. Their stage (early, growth, etc.)

Be thorough — this will be used for investor and competitive analysis.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const textBlocks = data.content.filter((b) => b.type === "text");
    const summary = textBlocks.map((b) => b.text).join("\n");

    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
