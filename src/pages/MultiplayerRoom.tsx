import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Video, VideoOff, User } from "lucide-react";
import { getProfile } from "@/lib/userProfile";

const TOPIC_POOL = [
  "Ordering your favourite coffee at a busy cafe.",
  "Asking a stranger for directions to the nearest MRT station.",
  "Discussing upcoming weekend plans with a coworker.",
  "Politely returning a defective item to a store cashier.",
  "Planning a shared grocery shopping list for a dinner party.",
  "Introducing yourself to a new neighbor."
];

interface MultiplayerRoomProps {
  onLeave: () => void;
}

export default function MultiplayerRoom({ onLeave }: MultiplayerRoomProps) {
  const profile = getProfile();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [topic, setTopic] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    // Randomize the topic when the room loads
    setTopic(TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)]);

    // Request Camera and Microphone access
    const startMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera/Mic access denied or unavailable.", err);
        setPermissionError(true);
      }
    };

    startMedia();

    // Cleanup: Turn off the camera when they leave the room
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Only run once on mount

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onLeave();
  };

  return (
    <div className="relative min-h-screen bg-gray-900 overflow-hidden flex items-center justify-center font-sans">
      
      {/* Remote User Placeholder (Background) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
        <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center mb-4 border-4 border-gray-700">
          <User className="w-16 h-16 text-gray-500" />
        </div>
        <p className="text-gray-400 text-xl font-medium animate-pulse">Partner Connected</p>
      </div>

      {/* Discussion Topic Overlay (Top) */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-8 left-0 right-0 px-4 z-10 flex justify-center"
      >
        <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-6 py-4 rounded-2xl max-w-lg text-center shadow-2xl">
          <p className="text-teal-400 text-sm font-bold tracking-wider uppercase mb-1">Current Topic</p>
          <p className="text-lg md:text-xl font-medium">{topic}</p>
        </div>
      </motion.div>

      {/* Permission Error Banner */}
      {permissionError && (
        <div className="absolute top-32 bg-red-500 text-white px-6 py-3 rounded-lg z-20">
          Please allow camera and microphone access to practice effectively.
        </div>
      )}

      {/* Local User PiP (Bottom Right) */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute bottom-32 right-6 w-32 md:w-48 aspect-[3/4] bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700 z-20"
      >
        {isVideoOff ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <User className="w-12 h-12 text-gray-500" />
          </div>
        ) : (
          <video 
            ref={localVideoRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover mirror"
            style={{ transform: "scaleX(-1)" }} // Mirrors the camera naturally
          />
        )}
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
          You ({profile?.name || "Learner"})
        </div>
      </motion.div>

      {/* Call Controls (Bottom Center) */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-20"
      >
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full border-0 ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-800/80 hover:bg-gray-700 text-white backdrop-blur-md'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        <Button 
          variant="destructive" 
          size="icon" 
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover:scale-105 transition-transform"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full border-0 ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-800/80 hover:bg-gray-700 text-white backdrop-blur-md'}`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>
      </motion.div>

    </div>
  );
}