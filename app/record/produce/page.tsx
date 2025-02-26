"use client";

import { useState } from "react";
import { useRecorder } from "../../hooks/useRecorder";
import Visualizer from "../../components/Visualizer";
import { MicrophoneIcon } from "../../components/icons/MicrophoneIcon";
import { MicrophoneState } from "../../context/MicrophoneContextProvider";

// Sample scripts
const SCRIPTS = [
  {
    id: "1",
    title: "Introduction Speech",
    content: "Hello everyone, my name is [Your Name]. I'm excited to be here today to talk about [Topic]. In the next few minutes, I'll share some insights about [Main Point 1], [Main Point 2], and [Main Point 3]. Let's get started!"
  },
  {
    id: "2",
    title: "Product Presentation",
    content: "Today I'm thrilled to introduce our newest product, [Product Name]. This innovative solution addresses [Problem] by providing [Solution]. Our customers have already seen [Benefit 1] and [Benefit 2]. Let me walk you through the key features..."
  },
  {
    id: "3",
    title: "Technical Explanation",
    content: "The system architecture consists of three main components: the frontend interface, the middleware processing layer, and the database backend. When a user initiates a request, it first passes through the authentication module before being routed to the appropriate service handler..."
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
