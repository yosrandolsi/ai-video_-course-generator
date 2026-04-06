export type Course = {
  id: number;
  courseId: string;
  courseName: string;
  userInput: string;
  type: string;
  userId: string;
  createdAt: string;
  courseLayout: courseLayout;
  chapters: Chapter[];                      // ✅ ajouté
  chapterContentSlides: chapterContentSlide[];
};

export type courseLayout = {
  courseName: string;
  courseDescription: string;
  courseId: string;
  level: string;
  totalChapters: number;
  chapters: chapter[];
};

export type chapter = {
  chapterId: string;
  chapterTitle: string;
  subContent: string[];
};

// ✅ Nouveau type pour les chapters de la DB (avec leurs slides)
export type Chapter = {
  id: number;
  courseId: string;
  chapterId: string;
  chapterTitle: string;
  videoContent?: any;
  captions?: any;
  audioFilterUrl?: string;
  createdAt?: string;
  chapterContentSlides: chapterContentSlide[]; // ✅ slides attachées
};

export type chapterContentSlide = {
  id: number;
  courseId: string;
  chapterId: string;
  slideId: string;
  slideIndex: number;
  audioFileName: string;
  narration: { fullText: string };
  html: string;
  revelData: string[];
  audioFileUrl: string;
  caption:{
    chuncks:string[];
  }
};