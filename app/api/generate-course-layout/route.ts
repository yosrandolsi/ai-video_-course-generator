import { NextRequest, NextResponse } from "next/server";
import genAI from "@/config/gemini";
import { COURSE_CONFIG_PROMPT } from "@/data/prompt";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { coursesTable } from "@/config/schema";

export async function POST(req: NextRequest) {
  try {
    // ✅ Auth
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Body
    const { userInput, type, courseId } = await req.json();

    if (!userInput || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Generating course:", userInput, type);

    // ✅ AI
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    const prompt = `
${COURSE_CONFIG_PROMPT}
Génère un cours pour : "${userInput}"
Type : ${type}
Retourne uniquement du JSON valide.
`;

    const response = await model.generateContent(prompt);
    const rawResult = response.response.text();

    // ✅ Parse JSON (clean sans nested try)
    const JSONResult = JSON.parse(rawResult);

    // ✅ Save DB
   await db.insert(coursesTable).values({
  userId: user.primaryEmailAddress?.emailAddress!, // ✅ email
  courseId: courseId,
  courseName: JSONResult.courseName || userInput,
  userInput: userInput,
  type: type,
  courseLayout: JSONResult,
});
    return NextResponse.json({
      success: true,
      data: JSONResult,
    });

  } catch (err: any) {
    console.error("API Error:", err);

    return NextResponse.json(
      {
        error: "Failed to generate course",
        details: err.message,
      },
      { status: 500 }
    );
  }
}