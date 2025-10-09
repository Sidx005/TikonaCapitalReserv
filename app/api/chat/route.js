import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, 
});

const systemPrompt =
  "You are a friendly AI assistant who answers queries about stocks. You can provide real-time stock prices, company info, and trends. Use the stock API to fetch real prices if the user asks for them.";

async function getStockPrice(symbol) {
  try {
    const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_API_KEY}`);
    const data = await res.json();
    return data['Global Quote'] ? data['Global Quote']['05. price'] : null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const { messages, msg } = await request.json();

    if (!messages || !msg) {
      return new Response(JSON.stringify({ error: "messages or msg missing" }), { status: 400 });
    }

    // Preprocess previous messages
    const processedMessages = messages
      .map((m) => m.parts?.[0]?.text ? { role: m.role === "model" ? "assistant" : "user", content: m.parts[0].text } : null)
      .filter(Boolean);


    let stockReply = null;
    const stockMatch = msg.match(/\b([A-Z]{1,5})\b/); 
    if (stockMatch) {
      const price = await getStockPrice(stockMatch[1]);
      if (price) stockReply = `The current price of ${stockMatch[1]} is $${price}`;
    }

    const enhancedMessages = [
      { role: "system", content: systemPrompt },
      ...processedMessages,
      { role: "user", content: msg },
    ];

    if (stockReply) {
      return new Response(stockReply, { headers: { "Content-Type": "text/plain" } });
    }

    const stream = await groq.chat.completions.create({
      messages: enhancedMessages,
      model: "llama-3.3-70b-versatile",
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of stream) {
              controller.enqueue(encoder.encode(chunk.choices[0]?.delta?.content || ""));
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      }),
      { headers: { "Content-Type": "text/plain" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
