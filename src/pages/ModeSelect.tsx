import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Users, ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/userProfile";

interface ModeSelectProps {
  onSelectSingle: () => void;
  onSelectMulti: () => void;
  onBack: () => void;
}

const ModeSelect = ({ onSelectSingle, onSelectMulti, onBack }: ModeSelectProps) => {
  const profile = getProfile();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Hi {profile?.name || "there"}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose how you'd like to practise
          </p>
        </div>

        <div className="space-y-4">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Card
              className="cursor-pointer border-2 hover:border-primary transition-colors"
              onClick={onSelectSingle}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">Single Player</h2>
                  <p className="text-muted-foreground">Practise on your own with our AI mascot guide</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Card
              className="cursor-pointer border-2 hover:border-primary transition-colors"
              onClick={onSelectMulti}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">Multiplayer</h2>
                  <p className="text-muted-foreground">Practise with a partner and switch turns in shared prompts</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModeSelect;
