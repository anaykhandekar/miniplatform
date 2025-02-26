"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "../context/DeepgramContextProvider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "../context/MicrophoneContextProvider";

export function useRecorder(initialCaption = "Powered by Deepgram") {

  const [caption, setCaption] = useState<string | undefined>(initialCaption);
  const { connection, connectToDeepgram, disconnectFromDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, stopMicrophone, microphoneState } = useMicrophone();
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();

  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [transcriptChunks, setTranscriptChunks] = useState<string>('');
  const [fullTranscript, setFullTranscript] = useState<string>('');

  useEffect(() => {
    const setup = async () => {
      try {
        await setupMicrophone();
        console.log("Microphone setup complete");
      } catch (error) {
        console.error("Failed to setup microphone:", error);
      }
    };
    
    setup();
    
    // Cleanup function to stop microphone when component unmounts
    return () => {
      stopMicrophone();
      clearTimeout(captionTimeout.current);
      clearInterval(keepAliveInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const initializeConnection = async () => {
      if (connectionState !== 1) {
        console.log(`Connection not open, connecting to Deepgram`);
        try {
          await connectToDeepgram({
            model: "nova-3",
            interim_results: true,
            smart_format: true,
            filler_words: true,
            utterance_end_ms: 3000,
          });
          console.log(`Successfully connected to Deepgram`);
        } catch (error) {
          console.error("Failed to connect to Deepgram:", error);
        }
      }
    };

    initializeConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  useEffect(() => {
    console.log(connectionState)
  }, [connectionState]);

  const downloadAudioBlob = () => {
    if (audioChunks.length === 0) return null;
    const blob = new Blob(audioChunks, { type: 'audio/mpeg' });
    return blob;
  }

  const downloadTextBlob = () => {
    if (transcriptChunks.trim()) return null;
    const blob = new Blob([transcriptChunks], { type: 'text/plain' });
    return blob;
  }

  const getFullTranscript = () => {
    return transcriptChunks;
  }

  const downloadRecording = () => {
    if (audioChunks.length === 0) return;
    
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = audioUrl;
    downloadLink.download = `recording-${new Date().toISOString()}.webm`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(audioUrl);
  }

  const downloadTranscript = () => {
    if (!transcriptChunks.trim()) return;
    
    const transcriptBlob = new Blob([transcriptChunks], { type: 'text/plain' });
    const transcriptUrl = URL.createObjectURL(transcriptBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = transcriptUrl;
    downloadLink.download = `transcript-${new Date().toISOString()}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(transcriptUrl);
  }

  useEffect(() => {
    if (!microphone) { 
        console.log("Microphone not set up - no listeners set up.")
        return; 
    }
    if (!connection) {
        console.log("Connection not set up - no listeners set up.")
        return;
    }

    const onData = (e: BlobEvent) => {
      if (e.data.size > 0) {
        connection?.send(e.data);
        console.log(`Blob sent ${e.data.size}`)
      }
      setAudioChunks(prevChunks => [...prevChunks, e.data]);
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let thisCaption = data.channel.alternatives[0].transcript;

      thisCaption = thisCaption.trim();
      
      if (thisCaption !== "") {
        console.log("Transcript received:", thisCaption);
        setCaption(thisCaption);
      }

      if (isFinal && speechFinal && thisCaption !== "") {
        clearTimeout(captionTimeout.current);
        setTranscriptChunks(prevChunks => prevChunks + (prevChunks ? ' ' : '') + thisCaption);
        setFullTranscript(prevTranscript => prevTranscript + (prevTranscript ? '\n' : '') + thisCaption);
        captionTimeout.current = setTimeout(() => {
          setCaption(undefined);
          clearTimeout(captionTimeout.current);
        }, 3000);
      }
    };
    
    try {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      console.log("Receiving set up.")
    } catch (error) {
      console.error("Error adding listener for LiveTranscriptionEvents.Transcript:", error);
    }

    try {
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);
      console.log("Sending set up.")
    } catch (error) {
      console.error("Error adding event listener for MicrophoneEvents.DataAvailable:", error);
    }
    

    return () => {
      // prettier-ignore
      connection?.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      disconnectFromDeepgram();
      microphone?.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphone, connectionState]);

  useEffect(() => {
    if (!connection) return;

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState]);

  const toggleMicrophone = () => {
    if (microphoneState === MicrophoneState.Open) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  return {
    // State
    caption,
    microphone,
    microphoneState,
    audioChunks,
    transcriptChunks,
    fullTranscript,
    
    // Actions
    toggleMicrophone,
    downloadRecording,
    downloadTranscript,
    downloadAudioBlob,
    downloadTextBlob,
    getFullTranscript,
    
    // Raw access if needed
    startMicrophone,
    stopMicrophone,
  };
}
