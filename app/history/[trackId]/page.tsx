"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";

type Recording = {
  id: string;
  submission_date: string;
  script_text: string;
  transcription: string;
  accuracy_score: number | null;
  s3_filepath: string;
  audio_url?: string;
};

export default function RecordingDetailPage({ params }: { params: { trackId: string } }) {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchRecording() {
      try {
        setLoading(true);
        
        // First, fetch the recording details from Supabase
        const response = await fetch('/api/s3');
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        const foundRecording = data.recordings?.find(
          (rec: Recording) => rec.id === params.trackId
        );
        
        if (!foundRecording) {
          throw new Error('Recording not found');
        }
        
        setRecording(foundRecording);
        
        // Then, get the signed URL for the audio file
        if (foundRecording.s3_filepath) {
          const urlResponse = await fetch(`/api/s3?key=${foundRecording.s3_filepath}`);
          const urlData = await urlResponse.json();
          
          if (urlData.url) {
            setAudioUrl(urlData.url);
          }
        }
      } catch (err: any) {
        console.error('Error fetching recording:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecording();
  }, [params.trackId]);
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !recording) {
    return (
      <div className="mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p>{error || "Recording not found"}</p>
        </div>
        <Link 
          href="/history"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-block"
        >
          Back to History
        </Link>
      </div>
    );
  }
  
  return (
    <div className="mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Recording Details</h1>
          <p className="text-gray-400">
            Recorded on {recording.submission_date ? 
              format(new Date(recording.submission_date), 'MMMM d, yyyy h:mm a') : 
              'N/A'}
          </p>
        </div>
        <Link 
          href="/history"
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
        >
          ← Back to History
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Audio Player</h2>
          
          {audioUrl ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="mb-4 flex justify-center">
                <button
                  onClick={togglePlayback}
                  className={`p-4 rounded-full ${
                    isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-8 h-8" />
                  ) : (
                    <PlayIcon className="w-8 h-8" />
                  )}
                </button>
              </div>
              
              <audio 
                ref={audioRef}
                src={audioUrl} 
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls
                className="w-full mt-4"
              />
              
              <div className="mt-4 text-center">
                <a 
                  href={audioUrl}
                  download={`recording-${recording.id}.mp3`}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-flex items-center"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Download Recording
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400">Audio file not available</p>
            </div>
          )}
          
          {recording.accuracy_score !== null && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-300 mb-2">Accuracy Score:</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-600 text-white">
                      {Math.round(recording.accuracy_score * 100)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                  <div 
                    style={{ width: `${Math.round(recording.accuracy_score * 100)}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Comparison</h2>
          
          <div className="grid grid-cols-1 gap-4 flex-1">
            <div>
              <h3 className="font-medium text-gray-300 mb-2">Original Script:</h3>
              <div className="bg-gray-800 rounded-lg p-4 h-40 overflow-y-auto">
                {recording.script_text || "No script available"}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-300 mb-2">Your Transcription:</h3>
              <div className="bg-gray-800 rounded-lg p-4 h-40 overflow-y-auto">
                {recording.transcription || "No transcription available"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple icon components
function PlayIcon({ className = "w-6 h-6" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PauseIcon({ className = "w-6 h-6" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DownloadIcon({ className = "w-6 h-6" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
