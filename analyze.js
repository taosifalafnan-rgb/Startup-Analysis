const SYSTEM_PROMPT = `You are a world-class startup advisor and venture analyst. You will be given research about a startup. Your job is to deeply analyze it and produce a structured report.

Respond ONLY with a valid JSON object. No markdown, no extra text, no backticks. Use this exact structure:

{
  "startup_name": "...",
  "one_liner": "...",
  "investor": {
    "type": "...",
    "stage": "...",
    "rationale": "...",
    "specific_firms": ["...", "...", "..."]
  },
  "competitors": [
    { "name": "...", "description": "...", "why_threat": "..." },
    { "name": "...", "description": "...", "why_threat": "..." },
    { "name": "...", "description": "...", "why_threat": "..." }
  ],
  "skills_needed": [
    { "skill": "...", "why": "..." },
    { "skill": "...", "why": "..." },
    { "skill": "...", "why": "..." },
    { "skill": "...", "why": "..." }
  ],
  "team_blueprint": [
    { "role": "...", "priority": "Immediate", "reason": "..." },
    { "role": "...", "priority": "3-6 months", "reason": "..." },
    { "role": "...", "priority": "6-12 months", "reason": "..." },
    { "role": "...", "priority": "6-12 months", "reason": "..." }
  ]
}

Be very specific. Name actual real competitor companies in the same region. Name actual real investor firms. Give actionable, no-fluff advice. Base everything on the research provided.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { summary, url } = req.body;
  if (!summary) return res.status(400).json({ error: "Summary is required" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Here is the research gathered about the startup at ${url}:\n\n${summary}\n\nNow produce the full JSON report.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    const report = JSON.parse(clean);

    return res.status(200).json({ report });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
