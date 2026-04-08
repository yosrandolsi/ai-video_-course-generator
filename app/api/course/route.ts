import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursesTable, chaptersTable, chapterContentSlides } from "@/config/schema";
import { desc, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const user = await currentUser();
  if (!courseId) {
  const userCourses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.userId, user?.primaryEmailAddress?.emailAddress as string))
    .orderBy(desc(coursesTable.id));
  return NextResponse.json(userCourses);
}

    // ✅ Fetch course
    const courseResult = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.courseId, courseId));

    if (!courseResult || courseResult.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const course = courseResult[0];

    // ✅ Fetch chapters
    const chapters = await db
      .select()
      .from(chaptersTable)
      .where(eq(chaptersTable.courseId, courseId));

    // ✅ Fetch chapter content slides
    const slides = await db
      .select()
      .from(chapterContentSlides)
      .where(eq(chapterContentSlides.courseId, courseId));

    // ✅ Attacher les slides à chaque chapter
    const chaptersWithSlides = chapters.map((chapter) => ({
      ...chapter,
      chapterContentSlides: slides.filter(
        (slide) => slide.chapterId === chapter.chapterId
      ),
    }));

    // ✅ Retourner tout ensemble
    return NextResponse.json({
      ...course,
      chapters: chaptersWithSlides,
      chapterContentSlides: slides,
    });

  } catch (err: any) {
    console.error("GET /api/course error:", err);
    return NextResponse.json(
      { error: "Failed to fetch course", details: err.message },
      { status: 500 }
    );
  }
}