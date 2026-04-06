// lib/tts-service.ts
// ✅ Utilise Microsoft Edge TTS (gratuit, sans limite, pas d'API key)
// Fallback : ElevenLabs si edge-tts échoue

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

// ✅ Génère l'audio avec edge-tts (Microsoft, 100% gratuit)
// Installation requise : pip install edge-tts
export const generateAudioEdgeTTS = async (
  text: string,
  fileName: string,
  voice = "en-US-JennyNeural" // Voix naturelle Microsoft
): Promise<Buffer> => {
  const tmpPath = path.join(os.tmpdir(), `${Date.now()}-${fileName}`);

  try {
    // Appelle edge-tts via CLI Python
    await execFileAsync("edge-tts", [
      "--voice", voice,
      "--text", text,
      "--write-media", tmpPath,
    ], { timeout: 60000 });

    const buffer = fs.readFileSync(tmpPath);
    fs.unlinkSync(tmpPath); // Nettoyage
    return buffer;

  } catch (err: any) {
    // Nettoyage si erreur
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw new Error(`edge-tts failed: ${err.message}`);
  }
};

// ✅ Fallback : ElevenLabs (tier gratuit : 10k chars/mois)
export const generateAudioElevenLabs = async (
  text: string,
  voiceId = "21m00Tcm4TlvDq8ikWAM" // Rachel - voix par défaut
): Promise<Buffer> => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// ✅ Fonction principale : essaie edge-tts, fallback ElevenLabs
export const generateAudio = async (
  text: string,
  fileName: string
): Promise<Buffer> => {
  // Si le texte est vide, génère un silence minimal
  if (!text?.trim()) {
    console.warn("⚠️ Narration vide, génération d'un buffer vide.");
    return Buffer.alloc(0);
  }

  try {
    console.log(`🎙️ edge-tts: génération pour "${fileName}"...`);
    const buffer = await generateAudioEdgeTTS(text, fileName);
    console.log(`✅ edge-tts: succès (${buffer.length} bytes)`);
    return buffer;
  } catch (edgeErr: any) {
    console.warn(`⚠️ edge-tts échoué: ${edgeErr.message}. Fallback ElevenLabs...`);
    const buffer = await generateAudioElevenLabs(text, fileName);
    console.log(`✅ ElevenLabs: succès (${buffer.length} bytes)`);
    return buffer;
  }
};