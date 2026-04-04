import { Course } from '@/type/CourseType';
import { BookOpen, ChartNoAxesColumnIncreasing, Sparkles } from 'lucide-react';
import React from 'react';
import { Player } from '@remotion/player';
import ChapterVideo from './ChapterVideo';

type Props = {
  course?: Course;
};

function CourseInfoCard({ course }: Props) {
  if (!course) {
    return (
      <div className="p-6 text-white rounded-2xl shadow-xl bg-gray-800">
        <p>Course data not available</p>
      </div>
    );
  }

  // ✅ Récupération sécurisée du layout
  const layout = course.courseLayout || {};
  const description = layout.courseDescription || "No description available";
  const level = layout.level || "N/A";
  const totalChapters = layout.totalChapters ?? 0;

  return (
    <div>
      <div
        className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-white rounded-2xl shadow-xl"
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #0f172a, #1e293b, #065f46)",
          height: "290px",
        }}
      >
        <div style={{ width: "90%" }}>
          <h2 className='flex gap-2 p-1 px-2 border rounded-2xl inline-flex'>
            <Sparkles /> Course Preview
          </h2>

          <h2 className='text-xl font-bold mt-4'>
            {course.courseName}
          </h2>

          <p className='text-lg text-muted-foreground mt-3'>
            {description}
          </p>

          <div className='mt-5 flex gap-3'>
            <h2 className='px-3 p-2 border rounded-xl flex gap-2 items-center inline-flex'>
              <ChartNoAxesColumnIncreasing style={{ color: '#38bdf8' }} />
              {level}
            </h2>

            <h2 className='px-3 p-2 border rounded-xl flex gap-2 items-center inline-flex'>
              <BookOpen style={{ color: '#34d399' }} />
              {totalChapters} Chapters
            </h2>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "10px",
            bottom: "10px",
            width: "45%",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Player
            component={ChapterVideo}
            durationInFrames={30}
            compositionWidth={1280}
            compositionHeight={720}
            fps={30}
            controls
            style={{
              width: '90%',
              height: '220px',
              borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CourseInfoCard;