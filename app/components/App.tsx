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
import Visualizer from "./Visualizer";
import { MicrophoneIcon } from "./icons/MicrophoneIcon";

const App: () => JSX.Element = () => {
  const [caption, setCaption] = useState<string | undefined>(
    "Powered by Deepgram"
  );
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, stopMicrophone, microphoneState } =
    useMicrophone();
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();

  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [transcriptChunks, setTranscriptChunks] = useState<string>('');

  useEffect(() => {
    setupMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-3",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        utterance_end_ms: 3000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  const downloadRecording = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm '});
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
    if (!microphone) return;
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      // iOS SAFARI FIX:
      // Prevent packetZero from being sent. If sent at size 0, the connection will close. 
      if (e.data.size > 0) {
        connection?.send(e.data);
      }
      setAudioChunks(prevChunks => [...prevChunks, e.data]);
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let thisCaption = data.channel.alternatives[0].transcript;

      console.log("thisCaption", thisCaption);
      if (thisCaption !== "") {
        console.log('thisCaption !== ""', thisCaption);
        setCaption(thisCaption);
      }

      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        setTranscriptChunks(prevChunks => prevChunks + ' ' + thisCaption);
        captionTimeout.current = setTimeout(() => {
          setCaption(undefined);
          clearTimeout(captionTimeout.current);
        }, 3000);
      }
    };

    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

      startMicrophone();
    }

    return () => {
      // prettier-ignore
      connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

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

  return (
    <>
      <div className="flex h-full antialiased">
        <div className="flex flex-row h-full w-full">
          <div className="flex flex-col flex-auto h-full">
            {/* height 100% minus 8rem */}
            <div className="relative w-full h-full">
              {microphone && <Visualizer microphone={microphone} />}
              <div className="absolute bottom-[8rem] inset-x-0 max-w-4xl mx-auto text-center">
                {caption && <span className="bg-black/70 p-8">{caption}</span>}
              </div>
              <div className="absolute bottom-0 inset-x-0 flex w-full items-center justify-center mb-5">
                <button 
                  className="flex items-center justify-center bg-white rounded-full p-4 shadow-md transition-transform hover:scale-110"
                  onClick={() => {
                    if (microphoneState === MicrophoneState.Open) {
                      stopMicrophone();
                    } else {
                      startMicrophone();
                    }
                  }}>
                  <MicrophoneIcon className="w-8 h-8 text-black" micOpen={microphoneState === MicrophoneState.Open}></MicrophoneIcon>
                </button>
              </div>
              <button className="text-white" onClick={() => {downloadRecording(); downloadTranscript();}}>
                DL
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
