const axios = require('axios');

const API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

if (!API_KEY || !ASSISTANT_ID) {
  throw new Error("API Key and Assistant ID must be set as environment variables.");
}

const HEADERS = {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  "OpenAI-Beta": "assistants=v2"  // Add this line
};

async function handleMessage(req, res) {
  const userInput = req.body.message;
  console.log("Received message:", userInput);

  if (!userInput) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Step 1: Create a Thread
    const threadResp = await axios.post("https://api.openai.com/v1/threads", {}, { headers: HEADERS });
    console.log("Thread created:", threadResp.data);
    const threadId = threadResp.data.id;

    // Step 2: Send User Message
    const messagePayload = { role: "user", content: userInput };
    console.log("Sending message payload:", messagePayload);
    await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, messagePayload, { headers: HEADERS });

    // Step 3: Start Assistant Run
    const runResp = await axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, { assistant_id: ASSISTANT_ID }, { headers: HEADERS });
    console.log("Assistant run started:", runResp.data);
    const runId = runResp.data.id;

    // Step 4: Poll Until Completion
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const statusResp = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, { headers: HEADERS });
      console.log("Polling status:", statusResp.data);
      if (statusResp.data.status === "completed") {
        break;
      }
    }

    // Step 5: Fetch Messages
    const messagesResp = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, { headers: HEADERS });
    console.log("Messages fetched:", messagesResp.data);
    const messages = messagesResp.data.data;

    // Extract Assistant's Response
    const botResponse = messages.find(msg => msg.role === "assistant")?.content[0]?.text?.value || "No response from assistant.";
    res.json({ response: botResponse });

  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { handleMessage };