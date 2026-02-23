"use client"

import React from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Send } from "lucide-react"
import { QUICK_VIDEO_SUGGESTIONS } from "@/data/constant"

function Hero() {
  return (
    <div className="px-4">

      {/* Title Section */}
      <div className="flex flex-col items-center mt-20 text-center">
        <h2 className="text-3xl font-bold">
          Learn Smarter with{" "}
          <span className="text-primary">AI Video Courses</span>
        </h2>
        <p className="text-gray-500 mt-3 text-xl">
          Turn Any Topic into a Complete Course
        </p>
      </div>

      {/* Input Section */}
      <div className="grid w-full max-w-xl gap-6 mx-auto mt-8 bg-white z-10 relative">
        <InputGroup>

          <InputGroupTextarea
            data-slot="input-group-control"
            className="min-h-24 w-full
            resize-none rounded-xl 
            px-3 py-2.5 text-base outline-none"
            placeholder="Enter a topic to generate your AI course..."
          />

          <InputGroupAddon align="block-end" className="flex items-center gap-2">

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Full Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="full-course">
                    Full Course
                  </SelectItem>
                  <SelectItem value="quick-explain-video">
                    Quick Explain Video
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <InputGroupButton
              className="ml-auto"
              size="icon-sm"
              variant="default"
            >
              <Send size={18} />
            </InputGroupButton>

          </InputGroupAddon>

        </InputGroup>
      </div>

      {/* Quick Suggestions */}
      <div className="flex gap-4 mt-8 max-w-3xl flex-wrap justify-center mx-auto ">
        {QUICK_VIDEO_SUGGESTIONS.map((suggestion, index) => (
          <h2
            key={index}
            className="border rounded-2xl px-3 py-1 text-sm hover:bg-primary hover:text-white cursor-pointer transition"
          >
            {suggestion.title}
          </h2>
        ))}
      </div>

    </div>
  )
}

export default Hero