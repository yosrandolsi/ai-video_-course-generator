import { ca, sl } from "date-fns/locale";
import { integer, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits:integer().default(2)
});
export const coursesTable = pgTable("courses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull().references(() => usersTable.email), // ⚠️ référence à email, pas id
  courseId: varchar({ length: 255 }).notNull(),
  courseName: varchar({ length: 255 }).notNull(),
  userInput: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 255 }).notNull(),
  courseLayout: json("courseLayout"), // ✅ correction ici
  createdAt: timestamp().defaultNow(),
});

export const chaptersTable = pgTable("chapters", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar({ length: 255 }).notNull().references(() => coursesTable.courseId), // ⚠️ référence à courseId, pas id
  chapterId: varchar({ length: 255 }).notNull(),
  chapterTitle: varchar({ length: 255 }).notNull(),
  videoContent: json(),
  captions: json(),
  audioFilterUrl: varchar({ length: 1024 }),
  createdAt: timestamp().defaultNow(),
});


export const chapterContentSlides=pgTable("chapter_content_slides", {
 id: integer().primaryKey().generatedAlwaysAsIdentity(),
courseId: varchar({ length: 255 }).notNull().references(() => coursesTable.courseId),
chapterId: varchar({ length: 255 }).notNull(),
slideId: varchar({ length: 255 }).notNull(),
slideIndex: integer().notNull(),
audioFileName: varchar({ length: 255 }).notNull(),
captions: json().notNull(),
audioFileUrl: varchar({ length: 1024 }).notNull(),
narration: json().notNull(),
html: text(),
revelData: json().notNull()
})
