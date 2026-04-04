import fetch from "node-fetch";

async function listModels() {
  const res = await fetch("https://generativelanguage.googleapis.com/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
  });

  const data = await res.json();
  console.log("📌 Modèles disponibles:", data);
}

listModels();
