// generate-course-layout.ts
import { NextRequest, NextResponse } from "next/server";
import groq from "@/config/groq"; // ✅ Groq SDK
import { COURSE_CONFIG_PROMPT } from "@/data/prompt";
import { auth,  currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { coursesTable, chaptersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
export async function POST(req: NextRequest) {
  try {
    // ✅ Auth user
    const user = await currentUser();
    const {has}=await auth();
    const isPaidUser = has({ plan: 'montly' })
 if(!isPaidUser){
  const userCourses = await db.select().from(coursesTable)
    .where(eq(coursesTable.userId, user?.primaryEmailAddress?.emailAddress!));

  if(userCourses?.length >= 2){
    return NextResponse.json(
      {msg:"You have reached the limit of free courses. Please upgrade to a paid plan to create more courses."},
      {status:403}
    );
  }
}
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Récupération du body
    const { userInput, type, courseId } = await req.json();
    if (!userInput || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Prompt pour Groq
    const prompt = `
${COURSE_CONFIG_PROMPT}

Génère un cours pour : "${userInput}"
Type : ${type}
Retourne uniquement du JSON valide, sans backticks, sans markdown.
`;

    // ✅ Appel Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // modèle gratuit performant
      messages: [
        { role: "system", content: "Tu es une IA qui ne retourne que du JSON valide." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const rawResult = completion.choices[0]?.message?.content || "";

    // ✅ Nettoyage texte
    const cleanText = rawResult
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // ✅ Parsing JSON
    let JSONResult;
    try {
      JSONResult = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("❌ JSON Parse Error:", parseErr);
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: cleanText },
        { status: 500 }
      );
    }

    // ✅ Insert course dans DB
    await db.insert(coursesTable).values({
      userId: user.primaryEmailAddress?.emailAddress!,
      courseId,
      courseName: JSONResult.courseName || userInput,
      userInput,
      type,
      courseLayout: JSONResult,
    });

    // ✅ Insert chapters
    if (JSONResult.chapters && JSONResult.chapters.length > 0) {
      const chaptersToInsert = JSONResult.chapters.map((chapter: any) => ({
        courseId,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.chapterTitle,
      }));

      await db.insert(chaptersTable).values(chaptersToInsert);
      console.log(`✅ ${chaptersToInsert.length} chapters inserted`);
    }

    // ✅ Return JSON
    return NextResponse.json({
      success: true,
      data: JSONResult,
    });

  } catch (err: any) {
    console.error("❌ API Error:", err);
    return NextResponse.json(
      { error: "Failed to generate course layout", details: err.message },
      { status: 500 }
    );
  }
}