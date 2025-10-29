// ai.js
const uploadBtn = document.getElementById("uploadBtn");
const fileUpload = document.getElementById("fileUpload");
const askBtn = document.getElementById("askBtn");
const promptInput = document.getElementById("promptInput");
const aiOutput = document.getElementById("aiOutput");

let uploadedFile = null;

// ========== UPLOAD PHOTO ==========
fileUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  uploadedFile = file;
  aiOutput.textContent = `📎 File ready: ${file.name}`;
});

uploadBtn.addEventListener("click", () => {
  if (!uploadedFile) {
    aiOutput.textContent = "⚠️ No file selected!";
    return;
  }
  aiOutput.textContent = `✅ Uploaded file: ${uploadedFile.name}`;
  // Optionally, send file to server if needed
});

// ========== ASK AI ==========
askBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    aiOutput.textContent = "⚠️ Please enter a question or prompt.";
    return;
  }

  aiOutput.textContent = "⏳ AI is thinking...";

  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();

    if (data.ok) {
      aiOutput.textContent = `💬 AI Response:\n${data.response}`;
    } else {
      aiOutput.textContent = `❌ Error: ${data.error || "Unknown error"}`;
    }
  } catch (err) {
    console.error(err);
    aiOutput.textContent = "❌ Server or network error.";
  }
});
