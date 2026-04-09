"use client";

import React from "react";
import Image from "next/image";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button"; // adapte selon ton projet
import Link from "next/link";

function Header() {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between p-4">
      
      {/* Logo */}
      <div className="flex gap-2 items-center">
        <Image src="/logo.png" alt="logo" width={60} height={60} />
        <h2 className="text-xl font-bold">
          <span className="text-primary">vid</span>Course
        </h2>
      </div>

      {/* Menu */}
      <ul className="flex gap-8 items-center">
        <li className="text-lg hover:text-primary font-medium cursor-pointer">
          Home
        </li>
        <Link href="/pricing">
  <li className="text-lg hover:text-primary font-medium cursor-pointer">
    Pricing
  </li>
</Link>
        
      </ul>

      {/* Auth */}
      {user ? (
        <UserButton />
      ) : (
        <SignInButton mode="modal">
          <Button>Get Started</Button>
        </SignInButton>
      )}
    </div>
  );
}

export default Header; 