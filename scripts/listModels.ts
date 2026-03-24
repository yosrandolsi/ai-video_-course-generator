import fetch from "node-fetch";

async function testGemini() {
  const res = await fetch("https://generativelanguage.googleapis.com/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
  });

  const data = await res.json();
  console.log(data);
}

testGemini();
