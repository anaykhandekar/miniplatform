"use client";

import { useState } from "react";
import { useRecorder } from "../../hooks/useRecorder";
import Visualizer from "../../components/Visualizer";
import { MicrophoneIcon } from "../../components/icons/MicrophoneIcon";
import { MicrophoneState } from "../../context/MicrophoneContextProvider";

// Updated scripts with more professional and varied content
const SCRIPTS = [
  {
    id: "1",
    title: "Professional Introduction",
    content: "Hello everyone, I'm pleased to introduce myself. I'm a software engineer with five years of experience in full-stack development. My expertise includes React, Node.js, and cloud infrastructure. I've worked on projects ranging from e-commerce platforms to data visualization tools. I'm passionate about creating clean, maintainable code and solving complex problems with elegant solutions."
  },
  {
    id: "2",
    title: "Project Presentation",
    content: "Today I'd like to present our latest project, a speech analysis platform that helps users improve their communication skills. This application records and transcribes speech in real-time, providing metrics on clarity, pacing, and vocabulary usage. Our beta testers have reported a 30% improvement in presentation confidence and a significant reduction in filler words. The technology combines WebRTC for audio capture with advanced AI models for speech processing."
  },
  {
    id: "3",
    title: "Technical Overview",
    content: "Our architecture follows a microservices approach with three core components. The frontend is built with Next.js and React, providing a responsive interface across devices. The middleware layer uses Node.js with Express, handling authentication, request validation, and service orchestration. For data persistence, we've implemented a PostgreSQL database with Supabase for real-time capabilities. All components are containerized with Docker and deployed on AWS using ECS for scalability."
  },
  {
    id: "4",
    title: "Customer Success Story",
    content: "I'd like to share how our solution helped Acme Corporation overcome their challenges. Before implementing our platform, they struggled with inconsistent data across departments and slow reporting cycles. After our three-month implementation, they achieved real-time visibility into operations, reduced report generation time by 85%, and identified cost-saving opportunities worth $1.2 million annually. The key to success was our collaborative approach and focus on user adoption throughout the organization."
  },
  {
    id: "5",
    title: "Product Demo Introduction",
    content: "Welcome to this demonstration of our speech analytics dashboard. In the next few minutes, I'll walk you through the main features and show you how easy it is to get started. You'll see how to record your first speech sample, review the automated analysis, and track your improvement over time. I'll also highlight our integration capabilities with popular video conferencing platforms. By the end of this demo, you'll understand how our tool can transform your communication effectiveness."
  }
];

export default function ScriptPage() {
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  const scriptContent = selectedScript 
    ? SCRIPTS.find(script => script.id === selectedScript)?.content 
    : null;
  
  const {
    caption,
    microphone,
    microphoneState,
    toggleMicrophone,
    downloadRecording,
    downloadTranscript,
    downloadAudioBlob,
    downloadTextBlob,
    getFullTranscript
  } = useRecorder("Script Mode - Start speaking");

  const handleUploadAudio = async () => {
    try {
        setIsUploading(true);

        const recordingBlob = await downloadAudioBlob();
        
        if (recordingBlob === null) {
            return;
        }

        const scriptContent = SCRIPTS.find(script => script.id === selectedScript)?.content || '';

        // Create form data to send to API
        const formData = new FormData();
        formData.append('file', recordingBlob, 'recording.mp3');
        formData.append('scriptId', selectedScript!);
        formData.append('scriptText', scriptContent);
        formData.append('transcription', getFullTranscript());

        const response = await fetch('/api/s3', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert(`Recording submitted successfully!`);
        } else {
            throw new Error(data.error || "Upload failed");
        }
    } catch (error) {
        console.error("Error saving recording:", error);
        alert("Failed to save recording. Please try again.")
    } finally {
        setIsUploading(false);
    }
  }
  
  if (!selectedScript) {
    return (
      <div className="mx-auto px-4 md:px-6 lg:px-8 h-full py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Script Recording</h1>
          <p className="text-gray-400">Select a script to practice and record</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SCRIPTS.map((script) => (
            <button
              key={script.id}
              className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-6 text-left"
              onClick={() => setSelectedScript(script.id)}
            >
              <h3 className="text-xl font-bold mb-2">{script.title}</h3>
              <p className="text-gray-400 line-clamp-3">{script.content.substring(0, 100)}...</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="mx-auto px-4 md:px-6 lg:px-8 h-full py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {SCRIPTS.find(script => script.id === selectedScript)?.title}
          </h1>
          <p className="text-gray-400">Read the script and record your voice</p>
        </div>
        <button
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
          onClick={() => setSelectedScript(null)}
        >
          ← Back to Scripts
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Script</h2>
          <div className="flex-1 bg-white/90 text-black rounded-lg p-6 overflow-y-auto whitespace-pre-wrap">
            {scriptContent}
          </div>
        </div>
        
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          {microphone && <Visualizer microphone={microphone} />}
          
          <div className="absolute bottom-[8rem] inset-x-0 max-w-4xl mx-auto text-center">
            {caption && <span className="bg-black/70 p-4 rounded">{caption}</span>}
          </div>
          
          <div className="absolute bottom-0 inset-x-0 flex w-full items-center justify-center mb-8">
            <button 
              className="flex items-center justify-center bg-white rounded-full p-4 shadow-md transition-transform hover:scale-110"
              onClick={toggleMicrophone}>
              <MicrophoneIcon 
                className="w-8 h-8 text-black" 
                micOpen={microphoneState === MicrophoneState.Open} 
              />
            </button>
          </div>
          
          <div className="absolute top-4 right-4 flex space-x-2">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              onClick={handleUploadAudio}
              disabled={isUploading}
            >
              {isUploading ? "Submitting..." : "Submit Recording"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
