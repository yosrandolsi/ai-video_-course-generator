// app/api/generate-video-content/route.ts
import groq from "@/config/groq";
import { GENERATE_VIDEO_CONTENT_PROMPT } from "@/data/prompt";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { chapterContentSlides } from "@/config/schema";
import axios from "axios";
import { BlobServiceClient } from "@azure/storage-blob";
import { ttsQueue } from "@/lib/tts-queue";
import { generateAudio } from "@/lib/tts-service"; // ✅ Nouveau service TTS

export async function POST(req: NextRequest) {
  try {
    const { chapter, courseId } = await req.json();

    if (!chapter || !courseId) {
      return NextResponse.json(
        { error: "Missing chapter or courseId" },
        { status: 400 }
      );
    }

    // ✅ Génération du contenu via Groq
    const prompt = `
${GENERATE_VIDEO_CONTENT_PROMPT}

Chapter details:
${JSON.stringify(chapter)}

IMPORTANT:
- Return ONLY valid JSON
- No explanation
- No backticks
- No markdown
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Tu es une IA qui ne retourne que du JSON valide." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const rawResult = completion.choices[0]?.message?.content || "";
    const cleanText = rawResult.replace(/```json/gi, "").replace(/```/g, "").trim();

    let VideoContentJson;
    try {
      VideoContentJson = JSON.parse(cleanText || "{}");
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: cleanText },
        { status: 500 }
      );
    }

    const slides = Array.isArray(VideoContentJson)
      ? VideoContentJson
      : VideoContentJson?.slides ??
        VideoContentJson?.chapters?.[0]?.slides ??
        [];

    console.log(`📦 ${slides.length} slides pour le chapitre ${chapter.chapterId}`);

    const audioFileUrls: string[] = [];
    const captionsArray: any[] = [];
    const insertedSlides: any[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideData = {
        courseId,
        chapterId: chapter.chapterId,
        slideId: slide.slideId ?? `${chapter.chapterId}-slide-${i + 1}`,
        slideIndex: slide.slideIndex ?? i + 1,
        audioFileName: slide.audioFileName ?? `${chapter.chapterId}-${i + 1}.mp3`,
        narration: slide.narration ?? { fullText: "" },
        html: slide.html ?? "",
        revelData: slide.revelData ?? slide.revealData ?? [],
      };

      const narration = slideData.narration?.fullText ?? "";
      console.log(`🎙️ [${i + 1}/${slides.length}] Slide: ${slideData.slideId}`);

      // ✅ Audio via queue + nouveau service TTS (edge-tts / ElevenLabs)
      const audioUrl = await ttsQueue.add(async () => {
        const audioBuffer = await generateAudio(narration, slideData.audioFileName);
        return SaveAudioToStorage(audioBuffer, slideData.audioFileName);
      });

      audioFileUrls.push(audioUrl);

      // ✅ Captions
      const captions = await GenerateCaptions(audioUrl);
      captionsArray.push(captions);

      // ✅ Insert immédiat en DB
      const [inserted] = await db
        .insert(chapterContentSlides)
        .values({
          courseId: slideData.courseId,
          chapterId: slideData.chapterId,
          slideIndex: slideData.slideIndex,
          slideId: slideData.slideId,
          audioFileName: slideData.audioFileName,
          narration: slideData.narration,
          html: slideData.html,
          revelData: slideData.revelData,
          audioFileUrl: audioUrl,
          captions: captions ?? {},
        })
        .returning();

      insertedSlides.push(inserted);
      console.log(`💾 Slide ${i + 1}/${slides.length} insérée.`);
    }

    return NextResponse.json({
      success: true,
      data: VideoContentJson,
      audioFileUrls,
      captionsArray,
    });

  } catch (err: any) {
    console.error("❌ API Error:", err);
    return NextResponse.json(
      { error: "Failed to generate video content", details: err.message },
      { status: 500 }
    );
  }
}

const SaveAudioToStorage = async (audioBuffer: Buffer, fileName: string): Promise<string> => {
  // ✅ Si buffer vide (narration vide), retourne une URL vide
  if (!audioBuffer || audioBuffer.length === 0) {
    console.warn(`⚠️ Buffer vide pour ${fileName}, skip upload.`);
    return "";
  }

  const blobService = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
  const container = blobService.getContainerClient(
    process.env.AZURE_STORAGE_CONTAINER_NAME!
  );
  const blobName = `tts/${fileName}`;
  const blockBlob = container.getBlockBlobClient(blobName);

  await blockBlob.uploadData(audioBuffer, {
    blobHTTPHeaders: {
      blobContentType: "audio/mpeg",
      blobCacheControl: "public, max-age=31536000, immutable",
    },
  });

  const publicBase = process.env.AZURE_STORAGE_PUBLIC_BASE_URL!;
  return publicBase
    ? `${publicBase}/${container.containerName}/${blobName}`
    : blockBlob.url;
};

const GenerateCaptions = async (audioUrl: string) => {
  // ✅ Si pas d'URL (narration vide), retourne captions vides
  if (!audioUrl) return { text: "", chunks: [] };

  const audioResponse = await axios.get(audioUrl, { responseType: "arraybuffer" });
  const audioBuffer = Buffer.from(audioResponse.data);
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const file = new File([blob], "audio.mp3", { type: "audio/mpeg" });

  const transcription = (await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
    language: "en",
  })) as any;

  return {
    text: transcription.text,
    chunks:
      transcription.segments?.map((segment: any) => ({
        text: segment.text,
        timestamp: [segment.start, segment.end],
      })) ?? [],
  };
};