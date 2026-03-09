import { useState, useRef, useCallback } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  isTranscribing: boolean;
  transcript: string;
  startListening: (language?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_TRANSCRIPTION_MODEL = "whisper-large-v3-turbo";

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const languageRef = useRef("en-US");

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const hasBrowserSpeechFallback = !!SpeechRecognition;
  const hasMediaRecorder = typeof window !== "undefined" && "MediaRecorder" in window;
  const isSupported = hasMediaRecorder || hasBrowserSpeechFallback;

  const transcribeWithGroq = useCallback(async (audioBlob: Blob, language: string) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Missing API key for transcription.");
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "speech.webm");
    formData.append("model", GROQ_TRANSCRIPTION_MODEL);
    formData.append("language", language.split("-")[0]);
    formData.append("response_format", "json");

    const response = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed with status ${response.status}`);
    }

    const payload = await response.json();
    return (payload?.text || "").trim();
  }, []);

  const stopMediaStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const fallbackStartBrowserRecognition = useCallback((language: string) => {
    if (!hasBrowserSpeechFallback) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        final += event.results[i][0].transcript;
      }
      setTranscript(final);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setError("Browser speech recognition failed.");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognition, hasBrowserSpeechFallback]);

  const startListening = useCallback((language = "en-US") => {
    setError(null);
    languageRef.current = language;
    chunksRef.current = [];

    if (!hasMediaRecorder) {
      fallbackStartBrowserRecognition(language);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          setIsListening(false);
          stopMediaStream();

          if (!audioBlob.size) {
            setError("No audio captured. Please try again.");
            return;
          }

          setIsTranscribing(true);
          try {
            const text = await transcribeWithGroq(audioBlob, languageRef.current);
            setTranscript(text);
          } catch {
            setError("Cloud transcription failed. Falling back to browser recognizer.");
            fallbackStartBrowserRecognition(languageRef.current);
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsListening(true);
      })
      .catch(() => {
        setError("Microphone access denied.");
      });
  }, [fallbackStartBrowserRecognition, hasMediaRecorder, stopMediaStream, transcribeWithGroq]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      return;
    }

    recognitionRef.current?.stop();
    stopMediaStream();
    setIsListening(false);
  }, [stopMediaStream]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    isTranscribing,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
};
