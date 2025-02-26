"use client";

import { Inter } from "next/font/google";
import classNames from "classnames";
import localFont from "next/font/local";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DeepgramContextProvider } from "./context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";

import "./globals.css";

import type { Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });
const favorit = localFont({
  src: "./fonts/ABCFavorit-Bold.woff2",
  variable: "--font-favorit",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  width: "device-width",
  // maximumScale: 1, hitting accessability
};

// export const metadata: Metadata = {
//   metadataBase: new URL("https://aura-tts-demo.deepgram.com"),
//   title: "Deepgram AI Agent",
//   description: `Deepgram's AI Agent Demo shows just how fast Speech-to-Text and Text-to-Speech can be.`,
//   robots: {
//     index: false,
//     follow: false,
//   },
// };

function Sidebar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="w-64 bg-gray-900 h-full overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">Deepgram Recorder</h1>
      </div>
      
      <div className="px-4 mb-2">
        <span className="text-gray-400 text-sm font-medium">Recording</span>
      </div>
      <nav className="mb-6">
        <ul className="space-y-1 px-2">
          <li>
            <Link 
              href="/record/practice" 
              className={`flex items-center px-4 py-2 text-sm rounded-md ${
                isActive("/record/practice")
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="mr-3">🎙️</span>
              Practice Mode
            </Link>
          </li>
          <li>
            <Link 
              href="/record/produce" 
              className={`flex items-center px-4 py-2 text-sm rounded-md ${
                isActive("/record/produce")
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="mr-3">📝</span>
              Script Mode
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="px-4 mb-2">
        <span className="text-gray-400 text-sm font-medium">History</span>
      </div>
      <nav>
        <ul className="space-y-1 px-2">
          <li>
            <Link 
              href="/history" 
              className={`flex items-center px-4 py-2 text-sm rounded-md ${
                isActive("/history")
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="mr-3">📚</span>
              View Recordings
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-dvh">
      <body
        className={`h-full dark ${classNames(
          favorit.variable,
          inter.className
        )}`}
      >
        <MicrophoneContextProvider>
          <DeepgramContextProvider>
            <div className="flex h-full">
              <Sidebar />
              <main className="flex-1 overflow-auto bg-black">
                {children}
              </main>
            </div>
          </DeepgramContextProvider>
        </MicrophoneContextProvider>
      </body>
    </html>
  );
}
