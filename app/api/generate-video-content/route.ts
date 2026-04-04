import groq from "@/config/groq";
import { GENERATE_VIDEO_CONTENT_PROMPT } from "@/data/prompt";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { chapterContentSlides } from "@/config/schema";
import axios from "axios";
import { BlobServiceClient } from "@azure/storage-blob";

export async function POST(req: NextRequest) {
  try {
    const { chapter, courseId } = await req.json();

    if (!chapter || !courseId) {
      return NextResponse.json(
        { error: "Missing chapter or courseId" },
        { status: 400 }
      );
    }

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

    const cleanText = rawResult
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let VideoContentJson;
    try {
      VideoContentJson = JSON.parse(cleanText || "{}");
    } catch (parseErr) {
      console.error("❌ JSON Parse Error:", parseErr);
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

    console.log(`📦 Slides found: ${slides.length} for chapter ${chapter.chapterId}`);

    let audioFileUrls: string[] = [];
    let captionsArray: any[] = [];

    if (slides.length > 0) {
      const slidesToInsert = slides.map((slide: any, index: number) => ({
        courseId: courseId,
        chapterId: chapter.chapterId,
        slideId: slide.slideId ?? `${chapter.chapterId}-slide-${index + 1}`,
        slideIndex: slide.slideIndex ?? index + 1,
        audioFileName: slide.audioFileName ?? `${chapter.chapterId}-${index + 1}.mp3`,
        narration: slide.narration ?? { fullText: "" },
        html: slide.html ?? "",
        revelData: slide.revelData ?? slide.revealData ?? [],
      }));

      // ✅ Générer audio + captions pour CHAQUE slide du chapitre
      for (const slide of slidesToInsert) {
        const narration = slide.narration?.fullText ?? "";

        const fonadaResult = await axios.post(
          "https://api.fonada.ai/tts/generate-audio-large",
          {
            input: narration,
            voice: "Vaanee",
            Languages: "English (United States)",
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.FONADALAB_API_KEY}`,
            },
            responseType: "arraybuffer",
            timeout: 120000,
          }
        );

        const audioBuffer = Buffer.from(fonadaResult.data);
        const audioUrl = await SaveAudioToStorage(audioBuffer, slide.audioFileName);
        audioFileUrls.push(audioUrl);

        const captions = await GenerateCaptions(audioUrl);
        captionsArray.push(captions);
      }

      // ✅ UN SEUL insert avec tout : audioFileUrl + captions inclus
      await Promise.all(
        slidesToInsert.map(async (slide: any, index: number) => {
          const result = await db.insert(chapterContentSlides).values({
            courseId: slide.courseId,
            chapterId: slide.chapterId,
            slideIndex: slide.slideIndex,
            slideId: slide.slideId,
            audioFileName: slide.audioFileName,
            narration: slide.narration,
            html: slide.html,
            revelData: slide.revelData,
            audioFileUrl: audioFileUrls[index],
            captions: captionsArray[index] ?? {}
          }).returning();

          console.log(result);
        })
      );

      console.log(`✅ ${slidesToInsert.length} slides inserted for chapter ${chapter.chapterId}`);

    } else {
      console.warn("⚠️ No slides found in AI response:", VideoContentJson);
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

const SaveAudioToStorage = async (audioBuffer: Buffer, fileName: string) => {
  const blobService = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
  const container = blobService.getContainerClient(
    process.env.AZURE_STORAGE_CONTAINER_NAME!
  );

  const blobName = `tts/${fileName}.mp3`;
  const blockBlob = container.getBlockBlobClient(blobName);

  await blockBlob.uploadData(audioBuffer, {
    blobHTTPHeaders: {
      blobContentType: "audio/mpeg",
      blobCacheControl: "public, max-age=31536000, immutable",
    },
  });

  const publicBase = process.env.AZURE_STORAGE_PUBLIC_BASE_URL!;
  const url = publicBase
    ? `${publicBase}/${container.containerName}/${blobName}`
    : blockBlob.url;

  return url;
};

const GenerateCaptions = async (audioUrl: string) => {
  const audioResponse = await axios.get(audioUrl, {
    responseType: "arraybuffer",
  });

  const audioBuffer = Buffer.from(audioResponse.data);

  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const file = new File([blob], "audio.mp3", { type: "audio/mpeg" });

  const transcription = await groq.audio.transcriptions.create({
    file: file,
    model: "whisper-large-v3-turbo",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
    language: "en",
  }) as any;

  return {
    text: transcription.text,
    chunks: transcription.segments?.map((segment: any) => ({
      text: segment.text,
      timestamp: [segment.start, segment.end],
    })) ?? [],
  };
};