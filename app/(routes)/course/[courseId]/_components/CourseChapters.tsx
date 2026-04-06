import { Course } from '@/type/CourseType';
import React, { useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card";
import { Dot } from 'lucide-react';
import { Player } from '@remotion/player';

import { getAudioData } from '@remotion/media-utils';
import { CourseComposition } from './ChapterVideo';

type Props = {
  course: Course | undefined;
}

function CourseChapters({ course }: Props) {

  const fps = 30;

  // ✅ stockage durée des slides
  const [durationsBySlidesId, setDurationsBySlidesId] =
    useState<Record<string, number> | null>(null);

  // ✅ calcul global des durées (UNE SEULE FOIS)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!course?.chapters) return;

      const allSlides = course.chapters.flatMap(
        (ch) => ch.chapterContentSlides ?? []
      );

      const entries = await Promise.all(
        allSlides.map(async (slide) => {
          const audio = await getAudioData(slide.audioFileUrl);
          const frames = Math.max(1, Math.ceil(audio.durationInSeconds * fps));
          return [slide.slideId, frames] as const;
        })
      );

      if (!cancelled) {
        setDurationsBySlidesId(Object.fromEntries(entries));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [course, fps]);

const getChapterDuration = (chapter: any) => {
  if (!durationsBySlidesId) return 30;

  const total = (chapter.chapterContentSlides ?? []).reduce(
    (sum: number, slide: any) => {
      const frames = durationsBySlidesId[slide.slideId] ?? fps * 6;
      return sum + frames;
    },
    0
  );

  // ✅ IMPORTANT : jamais 0
  return total > 0 ? total : 30;
};

  // ✅ Si pas de chapters en DB, fallback sur courseLayout
  const hasDbChapters = course?.chapters && course.chapters.length > 0;

  return (
    <div
      style={{
        marginTop: "-30px",
        position: "relative",
        zIndex: 10,
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "32px 40px",
        width: "80%",
        maxWidth: "900px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        backgroundColor: "#fff",
        margin: "-30px auto 40px auto",
      }}
    >
      <div className='flex justify-between items-center mb-4'>
        <h2 className='font-bold text-xl'>Course Preview</h2>
        <span className='text-sm text-muted-foreground'>Chapters and Short Preview</span>
      </div>

      <div className='flex flex-col gap-3'>
        {hasDbChapters
          ? // ✅ Cas 1 : chapters viennent de la DB (avec slides)
            course?.chapters?.map((chapter, index) => {

              const layoutChapter = course?.courseLayout?.chapters?.find(
                (c) => c.chapterId === chapter.chapterId
              );

              return (
                <Card
                  key={`chapter-${chapter.chapterId}`}
                  style={{ border: "1px solid #e5e7eb", borderRadius: "12px" }}
                >
                  <CardContent style={{ padding: "16px 20px" }}>
                    <div className='flex gap-4'>

                      {/* LEFT */}
                      <div className='flex-1'>
                        <div className='flex gap-3 items-center mb-3'>
                          <div
                            style={{
                              backgroundColor: "rgba(14, 165, 233, 0.35)",
                              height: "36px",
                              width: "36px",
                              minWidth: "36px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "10px",
                              fontWeight: "bold",
                              fontSize: "15px",
                              color: "#0369a1",
                            }}
                          >
                            {index + 1}
                          </div>
                          <span className='font-semibold text-base md:text-lg'>
                            {chapter.chapterTitle}
                          </span>
                        </div>

                        {layoutChapter?.subContent?.map((content, subIndex) => (
                          <div
                            key={`sub-${index}-${subIndex}`}
                            className='flex gap-1 items-center mt-1'
                          >
                            <Dot className='h-5 w-5 text-primary shrink-0' />
                            <span className='text-sm text-gray-700'>{content}</span>
                          </div>
                        ))}
                      </div>

                      {/* RIGHT */}
                      <div style={{ width: "40%", minWidth: "200px" }}>
                        <Player
  component={CourseComposition}
  inputProps={{
    slides: (chapter.chapterContentSlides ?? []) as any,
    durationsBySlideId: durationsBySlidesId ?? {},
  }}
  durationInFrames={
    durationsBySlidesId
      ? getChapterDuration(chapter)
      : 30
  }
  compositionWidth={1280}
  compositionHeight={720}
  fps={30}
  controls
  style={{
    width: '100%',
    height: '150px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
  }}
/>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })

          : // ✅ fallback (inchangé)
            course?.courseLayout?.chapters?.map((chapter, index) => (
              <Card
                key={`chapter-${index}`}
                style={{ border: "1px solid #e5e7eb", borderRadius: "12px" }}
              >
                <CardContent style={{ padding: "16px 20px" }}>
                  <div className='flex gap-4'>

                    <div className='flex-1'>
                      <div className='flex gap-3 items-center mb-3'>
                        <div
                          style={{
                            backgroundColor: "rgba(14, 165, 233, 0.35)",
                            height: "36px",
                            width: "36px",
                            minWidth: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "10px",
                            fontWeight: "bold",
                            fontSize: "15px",
                            color: "#0369a1",
                          }}
                        >
                          {index + 1}
                        </div>
                        <span className='font-semibold text-base md:text-lg'>
                          {chapter.chapterTitle}
                        </span>
                      </div>

                      {chapter.subContent?.map((content, subIndex) => (
                        <div
                          key={`sub-${index}-${subIndex}`}
                          className='flex gap-1 items-center mt-1'
                        >
                          <Dot className='h-5 w-5 text-primary shrink-0' />
                          <span className='text-sm text-gray-700'>{content}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ width: "40%", minWidth: "200px" }}>
                     <Player
  component={CourseComposition}
  inputProps={{ slides: [], durationsBySlideId: {} }}
  durationInFrames={30}
  compositionWidth={1280}
  compositionHeight={720}
  fps={30}
  controls
  style={{
    width: '100%',
    height: '150px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
  }}
/>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))
        }
      </div>
    </div>
  );
}

export default CourseChapters;