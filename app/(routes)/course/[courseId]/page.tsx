
"use client"
import React, { useEffect, useState } from 'react'
import CourseInfoCard from './_components/CourseInfoCard'
import CourseChapters from './_components/CourseChapters'
import axios from 'axios';
import { useParams } from 'next/navigation';
import { Course } from '@/type/CourseType';
import { toast } from 'sonner';

function CoursePreview() {
  const { courseId } = useParams();
  const [courseDetail, setCourseDetail] = useState<Course | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      GetCourseDetail();
    }
  }, [courseId]);

  const GetCourseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadingToast = toast.loading("Fetching course details...");
      const result = await axios.get(`/api/course?courseId=${courseId}`);
      console.log("✅ Course fetched:", result.data);
      setCourseDetail(result.data);
      toast.success("Course details loaded!", { id: loadingToast });

      if (result?.data?.chapterContentSlides?.length === 0) {
        GenerateVideoContent(result?.data);
      }

    } catch (err: any) {
      console.error("❌ Error fetching course:", err?.response?.data || err.message);
      setError("Failed to load course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <p className="text-red-500">{error}</p>
        <button
          onClick={GetCourseDetail}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

 const GenerateVideoContent = async (course: Course) => {
  for (let i = 0; i < course?.courseLayout?.chapters.length; i++) {
    const chapter = course?.courseLayout?.chapters[i];
    if (!chapter) continue;

    const toastLoading = toast.loading(`Generating video content for chapter ${i + 1}`);

    try {
      const result = await axios.post('/api/generate-video-content', {
        chapter: chapter,
        courseId: course.courseId,
      });

      console.log(`✅ Chapter ${i + 1} slides:`, result.data);
      toast.success(`Video content generated for chapter ${i + 1}`, { id: toastLoading });

    } catch (err: any) {
      console.error("❌ API ERROR:", err?.response?.data || err.message);
      toast.error(`Error generating chapter ${i + 1}`, { id: toastLoading });
    }
  }

  // ✅ Recharger le cours après génération pour avoir les slides
  await GetCourseDetail();
};

  return (
    <div className='flex flex-col items-center w-full gap-6 p-4'>
      <CourseInfoCard course={courseDetail} />
      <CourseChapters course={courseDetail} />
    </div>
  );
}

export default CoursePreview; 