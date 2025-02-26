"use client";

import { useRecorder } from "../../hooks/useRecorder";
import Visualizer from "../../components/Visualizer";
import { MicrophoneIcon } from "../../components/icons/MicrophoneIcon";
import { MicrophoneState } from "../../context/MicrophoneContextProvider";

export default function PracticePage() {
  const {
    caption,
    microphone,
    microphoneState,
    fullTranscript,
    toggleMicrophone,
    downloadRecording,
    downloadTranscript,
  } = useRecorder("Practice Mode - Start speaking");

  return (
    <div className="mx-auto px-4 md:px-6 lg:px-8 h-full py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Practice Mode</h1>
        <p className="text-gray-400">Practice speaking and see your transcript in real-time</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-5rem)]">
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
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Full Transcript</h2>
            <div className="flex space-x-2">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                onClick={downloadTranscript}
              >
                Save Transcript
              </button>
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                onClick={downloadRecording}
              >
                Save Audio
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-y-auto whitespace-pre-wrap">
            {fullTranscript || "Your transcript will appear here as you speak..."}
          </div>
        </div>
      </div>
    </div>
  );
}
