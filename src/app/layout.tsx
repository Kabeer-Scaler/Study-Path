import type { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit, LogIn, Map, MessageSquareText } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnPath AI",
  description: "Personalised learning path generator for any learner-selected topic"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="page-shell flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-teal-700 text-white">
                <BrainCircuit size={21} aria-hidden />
              </span>
              <span>
                <span className="block text-lg font-bold">LearnPath AI</span>
                <span className="block text-xs font-medium text-slate-500">
                  Adaptive AI Tutoring Platform
                </span>
              </span>
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
              <Link className="secondary-button min-h-9 px-3" href="/register">
                <Map size={16} aria-hidden />
                Register
              </Link>
              <Link className="secondary-button min-h-9 px-3" href="/login">
                <LogIn size={16} aria-hidden />
                Login
              </Link>
              <span className="secondary-button min-h-9 cursor-default px-3 text-slate-500">
                <MessageSquareText size={16} aria-hidden />
                Socratic Tutor
              </span>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
