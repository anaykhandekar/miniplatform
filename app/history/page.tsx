"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

type Recording = {
  id: string;
  submission_date: string;
  script_text: string;
  transcription: string;
  accuracy_score: number | null;
  s3_filepath: string;
};

export default function HistoryPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecordings() {
      try {
        setLoading(true);
        
        const response = await fetch('/api/s3');
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        setRecordings(data.recordings || []);
      } catch (err: any) {
        console.error('Error fetching recordings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecordings();
  }, []);
  
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Recording History</h1>
        <p className="text-gray-400">View your previous recordings</p>
      </div>
      
      {recordings.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold mb-2">No recordings yet</h2>
          <p className="text-gray-400 mb-4">You haven't made any recordings yet. Go to the recording page to get started.</p>
          <Link 
            href="/record/produce" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Go to Recording Page
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Script</th>
                <th className="px-4 py-3 text-left">Transcription</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recordings.map((recording) => (
                <tr key={recording.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    {recording.submission_date ? 
                      format(new Date(recording.submission_date), 'MMM d, yyyy h:mm a') : 
                      'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      {truncateText(recording.script_text, 50)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      {truncateText(recording.transcription, 50)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/history/${recording.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
