import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { airportCheckInScenario } from "@/data/airportScenario";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import CameraFeed from "@/components/CameraFeed";
import MascotAvatar from "@/components/MascotAvatar";
import { getProfile } from "@/lib/userProfile";
import { analyzeCheckpointWithAgent } from "@/lib/aiAgent";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Lightbulb,
  RotateCcw,
  Star,
  Loader2,
} from "lucide-react";

interface AirportCheckInProps {
  onBack: () => void;
}

const AirportCheckIn = ({ onBack }: AirportCheckInProps) => {
  const profile = getProfile();
  const effectiveProfile =
    profile ||
    ({
      name: "Traveler",
      age: "18",
      role: "learner",
      preferredLanguage: "en-US",
      createdAt: new Date().toISOString(),
    } as const);
  const userLanguage = profile?.preferredLanguage || "en-US";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mascotMessage, setMascotMessage] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintTimer, setHintTimer] = useState<NodeJS.Timeout | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coachingTip, setCoachingTip] = useState("");
  const [capturedAnswers, setCapturedAnswers] = useState<Record<string, string>>({});
  const lastProcessedTranscriptRef = useRef("");

  const {
    isListening,
    isTranscribing,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError,
  } = useSpeechRecognition();
  const { speak, isSpeaking, stop: stopSpeaking } = useSpeechSynthesis();

  const checkpoint = airportCheckInScenario[currentIndex];
  const isLastCheckpoint = currentIndex === airportCheckInScenario.length - 1;
  const progress = (currentIndex / (airportCheckInScenario.length - 1)) * 100;

  useEffect(() => {
    if (!checkpoint) return;

    setShowHint(false);
    setWaitingForResponse(false);
    setCoachingTip("");
    lastProcessedTranscriptRef.current = "";
    resetTranscript();

    const speakAndWait = async () => {
      const firstName = profile?.name?.split(" ")[0] || "there";
      const personalizedPrompt =
        checkpoint.id === "greeting"
          ? `Hi ${firstName}. ${checkpoint.mascotPrompt}`
          : checkpoint.mascotPrompt;

      setMascotMessage(personalizedPrompt);
      await speak(personalizedPrompt, userLanguage);

      if (!isLastCheckpoint) {
        setWaitingForResponse(true);
      } else {
        setTimeout(() => setIsComplete(true), 1600);
      }
    };

    speakAndWait();

    return () => {
      if (hintTimer) clearTimeout(hintTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (!waitingForResponse || isLastCheckpoint) return;
    const timer = setTimeout(() => setShowHint(true), 9000);
    setHintTimer(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingForResponse]);

  const processResponse = useCallback(
    async (userSpeech: string) => {
      if (!checkpoint || isLastCheckpoint) return;

      setIsAnalyzing(true);
      const result = await analyzeCheckpointWithAgent(checkpoint, userSpeech, effectiveProfile);
      setIsAnalyzing(false);

      if (result.coachingTip) {
        setCoachingTip(result.coachingTip);
      }

      if (result.accepted) {
        setShowHint(false);
        setWaitingForResponse(false);

        if (checkpoint.extractField) {
          setCapturedAnswers((prev) => ({
            ...prev,
            [checkpoint.extractField!]: result.extractedValue || userSpeech,
          }));
        }

        setMascotMessage(result.feedback);
        await speak(result.feedback, userLanguage);

        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 700);
      } else {
        setMascotMessage(result.feedback || checkpoint.hintPrompt);
        await speak(result.feedback || checkpoint.hintPrompt, userLanguage);
        setWaitingForResponse(true);
      }
    },
    [checkpoint, effectiveProfile, isLastCheckpoint, speak, userLanguage]
  );

  useEffect(() => {
    const cleaned = transcript.trim();
    if (!cleaned) return;
    if (!waitingForResponse || isAnalyzing || isTranscribing || isListening) return;
    if (cleaned === lastProcessedTranscriptRef.current) return;

    lastProcessedTranscriptRef.current = cleaned;
    processResponse(cleaned);
  }, [isAnalyzing, isListening, isTranscribing, processResponse, transcript, waitingForResponse]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      lastProcessedTranscriptRef.current = "";
      resetTranscript();
      startListening(userLanguage);
    }
  };

  const handleRestart = () => {
    stopSpeaking();
    setCurrentIndex(0);
    setIsComplete(false);
    setCapturedAnswers({});
    setCoachingTip("");
    resetTranscript();
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-12 px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-8xl mb-6"
        >
          ✈️
        </motion.div>
        <h2 className="font-display text-3xl font-bold text-foreground mb-3">
          Check-in Complete!
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Nice work, {profile?.name || "traveler"}. You completed this guided airport check-in.
        </p>
        <div className="mb-8 bg-card border-2 border-border rounded-xl p-4 text-left">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Session summary</p>
          <p className="text-foreground text-sm">Destination: {capturedAnswers.destination || "Not captured"}</p>
          <p className="text-foreground text-sm">Passengers: {capturedAnswers.passengers || "Not captured"}</p>
          <p className="text-foreground text-sm">Luggage: {capturedAnswers.luggage || "Not captured"}</p>
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4 + i * 0.15 }}
            >
              <Star className="w-8 h-8 fill-accent text-accent" />
            </motion.div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="accent" size="lg" onClick={handleRestart}>
            <RotateCcw className="w-5 h-5" /> Try Again
          </Button>
          <Button variant="outline" size="lg" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" /> Back
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-foreground">
            ✈️ Airport Check-in
          </h2>
          <p className="text-sm text-muted-foreground">
            Step {currentIndex + 1} of {airportCheckInScenario.length}
          </p>
        </div>
      </div>

      <Progress value={progress} className="mb-6 h-3" />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <CameraFeed />

          {waitingForResponse && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                size="xl"
                variant={isListening ? "destructive" : "accent"}
                className="w-full"
                onClick={handleMicToggle}
                disabled={!isSupported || isSpeaking || isAnalyzing || isTranscribing}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-6 h-6" /> Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" /> Tap to Speak
                  </>
                )}
              </Button>
              {!isSupported && (
                <p className="text-sm text-destructive text-center mt-2">
                  Speech recognition is not supported in this browser.
                </p>
              )}
              {speechError && (
                <p className="text-sm text-destructive text-center mt-2">{speechError}</p>
              )}
            </motion.div>
          )}

          {transcript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border-2 border-border rounded-xl p-4"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">You said:</p>
              <p className="text-foreground text-lg">"{transcript}"</p>
            </motion.div>
          )}

          {isAnalyzing && (
            <div className="bg-muted border rounded-xl p-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> AI agent is analyzing your response...
            </div>
          )}

          {isTranscribing && (
            <div className="bg-muted border rounded-xl p-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Transcribing speech with Whisper...
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-6">
          <MascotAvatar isSpeaking={isSpeaking} message={mascotMessage} />

          <AnimatePresence>
            {showHint && checkpoint?.hintPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4 flex items-start gap-3 max-w-sm"
              >
                <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{checkpoint.hintPrompt}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {coachingTip && (
            <div className="max-w-sm rounded-xl border bg-card p-3 text-sm text-muted-foreground">
              Coach tip: {coachingTip}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AirportCheckIn;
