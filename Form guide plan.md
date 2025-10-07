FormGuide Hybrid — Chrome Built-in + Cloud AI
🧠 Goal

Make the extension read, interpret, and explain web or PDF-based forms directly in Chrome — without filling them automatically.
It should combine Chrome’s built-in AI (on-device) with Claude 4.5 (cloud-based) via OpenRouter API.

🧩 Architecture Overview
🔹 Frontend:

HTML + CSS + Vanilla JS

Handles UI (popups, overlays, tooltips, and sidebar explanations)

Calls Chrome’s built-in AI locally first (for summaries or structure detection)

If deeper analysis is needed, sends the parsed data securely to a small backend (your AI bridge).

🔹 Backend (AI Bridge Server):

Node.js (Express) or Python (FastAPI / Flask) — choose one (Node.js is smoother with Chrome extensions)

Receives text / form data from extension

Calls Claude 4.5 via OpenRouter API

Sends back structured insights and explanations

⚙️ Detailed Implementation Plan
1️⃣ Remove the old Form Guide feature

Delete existing:

/formGuide.js

Any code in popup.js, background.js, or content.js referencing “form guide”

Any <div> or UI element related to form explanation

Old logic parsing inputs manually or using built-in heuristics

Clean up the manifest file:

Remove permissions related to old feature (if any unnecessary ones exist)

Keep "activeTab", "scripting", and "storage"

2️⃣ New Form Guide Flow (Hybrid Approach)
🧩 Step 1: Detect Form or PDF Context

Use Chrome’s built-in AI for lightweight detection.

chrome.ai.languageModel.capabilities().then((cap) => {
  if (cap.summarization) {
    // use summarizer to detect form context
  }
});


Then:

For HTML forms → Collect <input>, <select>, <label> elements.

For embedded or loaded PDFs → Use chrome.scripting.executeScript to extract visible text.

🧩 Step 2: Extract Form Structure

If the document is HTML:

const fields = [...document.querySelectorAll('input, select, textarea')].map(el => ({
  label: el.labels?.[0]?.innerText || el.placeholder || 'Unlabeled',
  type: el.type,
  name: el.name,
}));


If the document is a PDF (rendered in Chrome):

Inject Tesseract.js (client-side OCR)

Extract visible text from <embed> or <canvas> elements (used by Chrome’s built-in PDF viewer)

Pass extracted text chunks to Claude 4.5 via your backend

🧩 Step 3: Send for Deep AI Interpretation

Use your backend bridge to call Claude 4.5 via OpenRouter:

fetch("https://yourserver.com/interpret-form", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: fields || extractedText,
    context: "Explain this form's purpose and what each field likely means"
  })
});

🧠 Backend: Claude 4.5 via OpenRouter
Node.js (recommended)
import express from "express";
import fetch from "node-fetch";
const app = express();
app.use(express.json());

app.post("/interpret-form", async (req, res) => {
  const { content, context } = req.body;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_OPENROUTER_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "anthropic/claude-4.5",
      messages: [
        { role: "system", content: "You are a helpful form-explainer assistant." },
        { role: "user", content: `${context}\n\n${JSON.stringify(content, null, 2)}` }
      ]
    })
  });

  const data = await response.json();
  res.json({ explanation: data.choices?.[0]?.message?.content });
});

app.listen(3000, () => console.log("Server running on port 3000"));

🎨 UI / UX Design (Minimal & Helpful)
🔹 Popup UI

A “Scan & Explain Form” button.

A loading spinner (with soft gradient background).

A results panel showing:

Form Summary: (“This is a tax return form for reporting income.”)

Field Explanations: collapsible list

Name: “Enter your full legal name.”

Routing Number: “Used to identify your bank for direct deposit.”

Example look:
<div id="popup">
  <h2>FormGuide 🧾</h2>
  <button id="scanForm">Scan & Explain</button>
  <div id="results"></div>
</div>

🔹 In-Page Tooltip Mode (Optional)

When hovering on a form field, show a small bubble explaining it.

Use simple JS:

element.addEventListener("mouseenter", showTooltip);

🔒 Privacy-First Handling

Only send visible form metadata or text, never values entered by user.

Show a short popup note:
“Only form labels and structure are analyzed — your data never leaves your device.”

🧩 Tech & Libraries Used
Purpose	Tech
Frontend	HTML, CSS, Vanilla JS
OCR (PDF text)	Tesseract.js
Cloud AI	Claude 4.5 via OpenRouter
Local AI	Chrome built-in (Summarizer, Translator, Grammar)
Backend	Node.js (Express)
Deployment	Render / Vercel (server)
Communication	fetch or chrome.runtime.sendMessage()
🏆 Why This Can Win

Hybrid innovation → Uses Chrome’s experimental AI and a top-tier external model.

Privacy & Clarity → Doesn’t fill forms, just explains — perfect for “helpful + ethical AI”.

Smooth UX → One-click explanation, lightweight UI.

Claude 4.5 gives structured, polite, and accurate explanations of complex forms (better than Gemini in this context).


OPENROUTER API:
and API KEY: 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
Anthropic: Claude Sonnet 4.5
anthropic/claude-sonnet-4.5

Created Sep 29, 2025
1,000,000 context
Starting at $3/M input tokens
Starting at $15/M output tokens

Claude Sonnet 4.5 is Anthropic’s most advanced Sonnet model to date, optimized for real-world agents and coding workflows. It delivers state-of-the-art performance on coding benchmarks such as SWE-bench Verified, with improvements across system design, code security, and specification adherence. The model is designed for extended autonomous operation, maintaining task continuity across sessions and providing fact-based progress tracking.

Sonnet 4.5 also introduces stronger agentic capabilities, including improved tool orchestration, speculative parallel execution, and more efficient context and memory management. With enhanced context tracking and awareness of token usage across tool calls, it is particularly well-suited for multi-context and long-running workflows. Use cases span software engineering, cybersecurity, financial analysis, research agents, and other domains requiring sustained reasoning and tool use.

Sample code and API for Claude Sonnet 4.5
OpenRouter normalizes requests and responses across providers for you.

OpenRouter provides an OpenAI-compatible completion API to 400+ models & providers that you can call directly, or using the OpenAI SDK. Additionally, some third-party SDKs are available.

In the examples below, the OpenRouter-specific headers are optional. Setting them allows your app to appear on the OpenRouter leaderboards.

typescript

fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <OPENROUTER_API_KEY>",
    "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What is in this image?"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
            }
          }
        ]
      }
    ]
  })
});
Using third-party SDKs
For information about using third-party SDKs and frameworks with OpenRouter, please see our frameworks documentation.

See the Request docs for all possible fields, and Parameters for explanations of specific sampling parameters.


Final checklist before you start coding

 Create branch and archive old Form Guide files.

 Add libs/pdf-lib, pdf.js, tesseract.js to libs/ (local copies).

 Implement content-script.js to extract DOM forms and generate formRepresentation.

 Implement utils/sanitize.js and utils/form-parser.js.

 Implement ai-manager.js for both chrome.ai calls and OpenRouter wrapper (with consent flow).

 Implement sidebar.html / popup.html minimal UIs and UX flows.

 Add local tests for sanitization and detection on representative forms.

 Prepare Devpost materials: README, demo video, GitHub link, and explicit privacy description.