import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { scenarios } from "@/data/scenarios";
import AirportCheckIn from "@/components/AirportCheckIn";
import TherapistDashboard from "@/components/TherapistDashboard";
import Onboarding from "@/pages/Onboarding";
import ModeSelect from "@/pages/ModeSelect";
import MultiplayerLobby from "@/pages/MultiplayerLobby";
import MultiplayerRoom from "@/pages/MultiplayerRoom";
import PostMatchFeedback from "@/pages/PostMatchFeedback"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProfile, clearProfile } from "@/lib/userProfile";
import { LogOut } from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";

type CategoryFilter = "all" | "food" | "help" | "shopping" | "social";
type AppView = "onboarding" | "mode-select" | "home" | "scenario" | "airport-checkin" | "multiplayer-lobby" | "multiplayer-room" | "post-match-feedback";

const Index = () => {
  const [view, setView] = useState<AppView>("onboarding");
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  
  // NEW: State to remember which room they were just in!
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setView(profile.role === "therapist" ? "therapist-dashboard" : "mode-select");
    }
  }, []);

  const handleLogout = () => {
    clearProfile();
    setView("onboarding");
  };

  const handleStartSelectedPractice = () => {
    if (selectedMode === "airport-voice") {
      setView("airport-checkin");
      return;
    }

    if (selectedMode === "airport-aac") {
      setView("airport-checkin-aac");
      return;
    }
  };

  if (view === "onboarding") {
    return (
      <Onboarding
        onComplete={() => {
          const profile = getProfile();
          setView(profile?.role === "therapist" ? "therapist-dashboard" : "mode-select");
        }}
      />
    );
  }

  if (view === "therapist-dashboard") {
    const therapistProfile = getProfile();

    if (!therapistProfile || therapistProfile.role !== "therapist") {
      setView("onboarding");
      return null;
    }

    return <TherapistDashboard profile={therapistProfile} onBack={handleLogout} />;
  }

  if (view === "mode-select") {
    return (
      <ModeSelect
        onSelectSingle={() => setView("home")}
        onSelectMulti={() => setView("multiplayer-lobby")}
        onBack={handleLogout}
      />
    );
  }

  if (view === "multiplayer-lobby") {
    return (
      <MultiplayerLobby 
        onBack={() => setView("mode-select")}
        onMatchFound={(roomId) => {
          console.log("Match found! Room:", roomId);
          setActiveRoomId(roomId); // <-- Save the Room ID here
          setView("multiplayer-room");
        }}
      />
    );
  }

  if (view === "multiplayer-room") {
    return <MultiplayerRoom onLeave={() => setView("post-match-feedback")} />;
  }

  if (view === "post-match-feedback") {
    return (
      <PostMatchFeedback 
        roomId={activeRoomId} // <-- Pass it to the feedback form
        onComplete={() => {
          setActiveRoomId(null); // Clear it out when done
          setView("mode-select");
        }} 
      />
    );
  }

  if (view === "airport-checkin") {
    return (
      <div className="min-h-screen bg-background py-6">
        <AirportCheckIn onBack={() => setView("home")} mode="voice" scenarioId={selectedScenarioId} />
      </div>
    );
  }

  if (view === "airport-checkin-aac") {
    return (
      <div className="min-h-screen bg-background py-6">
        <AirportCheckIn onBack={() => setView("home")} mode="aac" scenarioId={selectedScenarioId} />
      </div>
    );
  }

  const profile = getProfile();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden bg-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> {profile?.name}
            </Button>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div
              className="flex-1 text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Practice Talking,{" "}
                <span className="text-primary">Build Confidence</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-lg">
                Interactive scenarios to help you practise everyday communication
                skills — at your own pace, in a safe space.
              </p>
            </motion.div>
            <motion.div
              className="flex-shrink-0 w-64 md:w-80"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img
                src={heroIllustration}
                alt="People communicating together using assistive technology"
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Unified scenario menu */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Scenario Practice</h2>
          <p className="text-muted-foreground text-lg mb-6">
            Choose a scenario from the menu, then start practice.
          </p>

          <Card className="border-2 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mode</p>
                <Select
                  value={selectedMode}
                  onValueChange={(value) => setSelectedMode(value as PracticeMode)}
                >
                  <SelectTrigger aria-label="Select mode">
                    <SelectValue placeholder="Choose a mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Practice Mode</SelectLabel>
                      <SelectItem value="airport-voice">Voice Mode</SelectItem>
                      <SelectItem value="airport-aac">AAC Mode</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Scenario</p>
                <Select value={selectedScenarioId} onValueChange={setSelectedScenarioId}>
                  <SelectTrigger aria-label="Select scenario">
                    <SelectValue placeholder="Choose a scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>All Scenarios</SelectLabel>
                      <SelectItem value="airport-checkin">✈️ Airport Check-in</SelectItem>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.icon} {scenario.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Button size="lg" variant="accent" onClick={handleStartSelectedPractice}>
                Start Selected Scenario
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">
          CommPractice — Empowering communication through practice.
          <br />
          Serving people with disabilities.
        </p>
      </footer>
    </div>
  );
};

export default Index;