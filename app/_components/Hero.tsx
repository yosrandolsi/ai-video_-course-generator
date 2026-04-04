"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea
} from "@/components/ui/input-group";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { Loader2, Send } from "lucide-react";
import { QUICK_VIDEO_SUGGESTIONS } from "@/data/constant";
import { useRouter } from "next/navigation";

function Hero() {
  const [userInput, setUserInput] = useState("");
  const [type, setType] = useState("full-course");
  const [loading, setLoading] = useState(false);
  const router=useRouter();
  const { user } = useUser();
  const courseId = crypto.randomUUID(); // ✅ correct
  const GenerateCourseLayout = async () => {
    if (!user) {
      toast.error("Please sign in to generate courses");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Generating your course layout...");

    try {
const result = await axios.post("/api/generate-course-layout", { 
  userInput, 
  type, 
  courseId 
});


      if (result.data.error) {
        toast.error(result.data.error);
      } else {
        console.log("Course generated:", result.data.data);
        toast.success("Course generated successfully!");
        //navigate to course editor page


        router.push(`/course/${courseId}`);
      }
    } catch (err: any) {
      console.error("Axios error:", err);
      toast.error(err.message || "Server error");
    } finally {
      setLoading(false);
      toast.dismiss(toastId);
      toast.success("Course generation completed! Check console for details.")}
  };

  return (
    <div className="px-4">
      {/* Title Section */}
      <div className="flex flex-col items-center mt-20 text-center">
        <h2 className="text-3xl font-bold">
          Learn Smarter with <span className="text-primary">AI Video Courses</span>
        </h2>
        <p className="text-gray-500 mt-3 text-xl">Turn Any Topic into a Complete Course</p>
      </div>

      {/* Input Section */}
      <div className="grid w-full max-w-xl gap-6 mx-auto mt-8 bg-white z-10 relative">
        <InputGroup>
          <InputGroupTextarea
            data-slot="input-group-control"
            className="min-h-24 w-full resize-none rounded-xl px-3 py-2.5 text-base outline-none"
            placeholder="Enter a topic to generate your AI course..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />

          <InputGroupAddon align="block-end" className="flex items-center gap-2">
            <Select onValueChange={(value) => setType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Full Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="full-course">Full Course</SelectItem>
                  <SelectItem value="quick-explain-video">Quick Explain Video</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {user ? (
              <InputGroupButton
                className="ml-auto"
                size="icon-sm"
                variant="default"
                onClick={GenerateCourseLayout}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              </InputGroupButton>
            ) : (
              <SignInButton mode="modal">
                <InputGroupButton
                  className="ml-auto"
                  size="icon-sm"
                  variant="default"
                  onClick={() => toast.error("Please sign in to generate courses")}
                >
                  <Send size={18} />
                </InputGroupButton>
              </SignInButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Quick Suggestions */}
      <div className="flex gap-4 mt-8 max-w-3xl flex-wrap justify-center mx-auto">
        {QUICK_VIDEO_SUGGESTIONS.map((suggestion, index) => (
          <h2
            key={index}
            onClick={() => setUserInput(suggestion?.prompt)}
            className="border rounded-2xl px-3 py-1 text-sm hover:bg-primary hover:text-white cursor-pointer transition"
          >
            {suggestion.title}
          </h2>
        ))}
      </div>
    </div>
  );
}

export default Hero;