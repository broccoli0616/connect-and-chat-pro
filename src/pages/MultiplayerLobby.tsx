import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface MultiplayerLobbyProps {
  onBack: () => void;
  onMatchReady: () => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const MultiplayerLobby = ({ onBack, onMatchReady }: MultiplayerLobbyProps) => {
  const { profile, user } = useAuth();
  const [status, setStatus] = useState<"idle" | "searching" | "matched">("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const searchProgress = Math.min(100, Math.round((elapsedSeconds / 15) * 100));

  // Elapsed timer while searching
  useEffect(() => {
    if (status !== "searching") return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const startMatching = useCallback(async () => {
    if (!user) return;
    setOpponentName(null);
    setElapsedSeconds(0);
    setStatus("searching");

    try {
      // Call the matchmake edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await supabase.functions.invoke("matchmake", {
        body: { scenarioId: "airport-checkin" },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.data?.status === "matched") {
        setOpponentName(res.data.opponentId);
        setStatus("matched");
        return;
      }

      // Not matched yet — poll the queue for updates
      const interval = setInterval(async () => {
        const pollRes = await supabase.functions.invoke("matchmake", {
          body: { scenarioId: "airport-checkin" },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (pollRes.data?.status === "matched") {
          setOpponentName(pollRes.data.opponentId);
          setStatus("matched");
          clearInterval(interval);
          setPollInterval(null);
        }
      }, 3000);

      setPollInterval(interval);
    } catch {
      console.warn("[MultiplayerLobby] Matchmaking failed");
      setStatus("idle");
    }
  }, [user]);

  const cancelMatching = useCallback(async () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    // Remove from queue
    if (user) {
      await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
    }

    setStatus("idle");
    setElapsedSeconds(0);
    setOpponentName(null);
  }, [pollInterval, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Multiplayer Lobby</h1>
                <p className="text-muted-foreground mt-2">
                  Match with another player and practise speaking turns together.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit">
                <Users className="w-3.5 h-3.5 mr-1" />
                Live matchmaking
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border border-border">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(profile?.name || "You")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{profile?.name || "Guest Player"}</p>
                      <p className="text-sm text-muted-foreground">You</p>
                    </div>
                  </div>
                  <Badge variant="outline">Preferred Scenario: Airport Check-in</Badge>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-5 space-y-4">
                  <p className="font-semibold text-foreground">Queue Status</p>

                  {status === "idle" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Ready to find a partner for a live practice session.</p>
                      <Button className="w-full" variant="accent" onClick={startMatching}>
                        <Search className="w-4 h-4" />
                        Find Match
                      </Button>
                    </div>
                  )}

                  {status === "searching" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Searching... ({elapsedSeconds}s)</span>
                        <span className="font-semibold text-foreground">{searchProgress}%</span>
                      </div>
                      <Progress value={searchProgress} />
                      <p className="text-sm text-muted-foreground">
                        Looking for a partner with a similar level. Checking every few seconds.
                      </p>
                      <Button className="w-full" variant="outline" onClick={cancelMatching}>
                        Cancel Search
                      </Button>
                    </div>
                  )}

                  {status === "matched" && opponentName && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
                        <Zap className="w-5 h-5 text-success" />
                        <div>
                          <p className="font-semibold text-foreground">Match Found!</p>
                          <p className="text-sm text-muted-foreground">You have been paired with a partner</p>
                        </div>
                      </div>

                      <Button className="w-full" variant="success" onClick={onMatchReady}>
                        Start Practice Session
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
                Back to Mode Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MultiplayerLobby;
