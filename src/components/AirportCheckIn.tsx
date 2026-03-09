import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { airportCheckInScenario } from "@/data/airportScenario";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import CameraFeed from "@/components/CameraFeed";
import MascotAvatar from "@/components/MascotAvatar";
import { ArrowLeft, Mic, MicOff, Lightbulb, RotateCcw, Star } from "lucide-react";

interface AirportCheckInProps {
  onBack: () => void;
  mode?: "voice" | "aac";
}

const AirportCheckIn = ({ onBack }: AirportCheckInProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mascotMessage, setMascotMessage] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintTimer, setHintTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition();
  const { speak, isSpeaking, stop: stopSpeaking } = useSpeechSynthesis();

  const safeSpeak = useCallback(
    async (text: string) => {
      // Never let blocked/slow TTS freeze scenario progression.
      await Promise.race([
        speak(text),
        new Promise<void>((resolve) => setTimeout(resolve, 1800)),
      ]);
    },
    [speak]
  );

  const lastCheckpointIndex = airportCheckInScenario.length - 1;
  const safeIndex = Math.min(Math.max(currentIndex, 0), lastCheckpointIndex);
  const checkpoint = airportCheckInScenario[safeIndex];
  const isLastCheckpoint = safeIndex === lastCheckpointIndex;
  const progress = (safeIndex / lastCheckpointIndex) * 100;
  const availableCards = checkpoint?.aacPictureCards.filter(Boolean) ?? [];

  const getCardById = useCallback(
    (cardId: string) => availableCards.find((card) => card.id === cardId),
    [availableCards]
  );

  const isValidAacSelection = useCallback(
    (selectedIds: string[]) => {
      if (!checkpoint?.validAacCombinations?.length) return false;
      const normalized = [...selectedIds].sort();
      return checkpoint.validAacCombinations.some((combo) => {
        const sortedCombo = [...combo].sort();
        if (sortedCombo.length !== normalized.length) return false;
        return sortedCombo.every((id, idx) => id === normalized[idx]);
      });
    },
    [checkpoint]
  );

  useEffect(() => {
    if (!checkpoint) return;
    setMascotMessage(checkpoint.mascotPrompt);
    setShowHint(false);
    setWaitingForResponse(false);
    resetTranscript();

    const speakAndWait = async () => {
      await speak(checkpoint.mascotPrompt);
      if (!isLastCheckpoint) {
        setWaitingForResponse(true);
        setIsAdvancing(false);
      } else {
        setTimeout(() => setIsComplete(true), 1600);
      }
      void safeSpeak(checkpoint.mascotPrompt);
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
      const lower = userSpeech.toLowerCase();

      // For destination (first checkpoint), accept any multi-word answer
      const isAccepted =
        checkpoint.id === "greeting"
          ? lower.trim().length > 2
          : checkpoint.keywords.some((kw) => lower.includes(kw));

      if (isAccepted) {
        setShowHint(false);
        setWaitingForResponse(false);
        setMascotMessage(checkpoint.successResponse);
        await speak(checkpoint.successResponse);
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 800);
      } else {
        setMascotMessage(checkpoint.hintPrompt);
        await speak(checkpoint.hintPrompt);
        setWaitingForResponse(true);
      }
    },
    [checkpoint, isLastCheckpoint, speak]
  );

  useEffect(() => {
    if (!isListening && transcript && waitingForResponse) {
      processResponse(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const handleMicToggle = () => {
    if (mode !== "voice") return;
    if (isListening) {
      stopListening();
    } else {
      lastProcessedTranscriptRef.current = "";
      resetTranscript();
      startListening(userLanguage);
    }
  };

  const handleAacCardSelect = (cardId: string) => {
    if (!waitingForResponse || isSpeaking) return;
    setAacStrip((prev) => {
      if (prev.includes(cardId)) return prev;
      return [...prev, cardId].slice(-6);
    });
  };

  const handleAacUndo = () => {
    setAacStrip((prev) => prev.slice(0, -1));
  };

  const handleAacSend = () => {
    if (!checkpoint || !waitingForResponse || aacStrip.length === 0 || isAdvancing) return;
    if (isValidAacSelection(aacStrip)) {
      const selectedMessage = aacStrip
        .map((cardId) => getCardById(cardId)?.label || "")
        .filter(Boolean)
        .join(" ");
      processResponse(selectedMessage);
      return;
    }

    setMascotMessage(checkpoint.hintPrompt);
    void safeSpeak(checkpoint.hintPrompt);
    setWaitingForResponse(true);
  };

  const handleRestart = () => {
    stopListening();
    stopSpeaking();
    setCurrentIndex(0);
    setIsComplete(false);
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
          You successfully completed the airport check-in! Great communication skills!
        </p>
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

  if (!checkpoint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground mb-4">Something went wrong with this step. Please restart.</p>
        <Button variant="accent" onClick={handleRestart}>
          <RotateCcw className="w-4 h-4" /> Restart Scenario
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
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

      <Progress value={progress} className="mb-4 h-3" />

      <div className="mb-6 rounded-xl border bg-card p-3">
        <p className="text-sm font-medium mb-2">Conversation mode</p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={selectedMode === "coaching" ? "accent" : "outline"}
            onClick={() => setSelectedMode("coaching")}
            disabled={isListening || isAnalyzing || isTranscribing}
          >
            Coaching
          </Button>
          <Button
            type="button"
            size="sm"
            variant={selectedMode === "realistic" ? "accent" : "outline"}
            onClick={() => setSelectedMode("realistic")}
            disabled={isListening || isAnalyzing || isTranscribing}
          >
            Realistic
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {selectedMode === "coaching"
            ? "AI guides you and gives tips."
            : "AI behaves like real check-in staff with less guidance."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Camera + Mic */}
        <div className="space-y-4">
          {mode === "voice" && <CameraFeed />}

          {/* Mic button */}
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

          {/* Transcript */}
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