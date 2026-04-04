import { Course } from '@/type/CourseType';
import React from 'react'
import { Card, CardContent } from "@/components/ui/card";
import { Dot } from 'lucide-react';
import { Player } from '@remotion/player';
import ChapterVideo from './ChapterVideo';

type Props = {
    course: Course | undefined;
}

function CourseChapters({ course }: Props) {

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
              // Croiser avec courseLayout pour récupérer subContent
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

                      {/* Colonne gauche : titre + bullets */}
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

                        {/* subContent depuis courseLayout */}
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

                      {/* Colonne droite : Player avec vraies slides */}
                      <div style={{ width: "40%", minWidth: "200px" }}>
                        <Player
                          component={ChapterVideo}
                          inputProps={{
                            slides: chapter.chapterContentSlides ?? [],
                          }}
                          durationInFrames={
                            chapter.chapterContentSlides?.length
                              ? chapter.chapterContentSlides.length * 30
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

          : // ✅ Cas 2 : fallback sur courseLayout (chapters pas encore générés)
            course?.courseLayout?.chapters?.map((chapter, index) => (
              <Card
                key={`chapter-${index}`}
                style={{ border: "1px solid #e5e7eb", borderRadius: "12px" }}
              >
                <CardContent style={{ padding: "16px 20px" }}>
                  <div className='flex gap-4'>

                    {/* Colonne gauche */}
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

                    {/* Colonne droite : Player vide (pas encore de slides) */}
                    <div style={{ width: "40%", minWidth: "200px" }}>
                      <Player
                        component={ChapterVideo}
                        inputProps={{ slides: [] }}
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