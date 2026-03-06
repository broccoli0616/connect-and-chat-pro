import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { saveProfile, UserProfile } from "@/lib/userProfile";
import { User, ArrowRight } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const roles = [
  { value: "learner" as const, label: "I'm practising", icon: "🎓" },
  { value: "caregiver" as const, label: "I'm a caregiver", icon: "🤝" },
  { value: "therapist" as const, label: "I'm a therapist", icon: "💼" },
];

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState<UserProfile["role"] | "">("");

  const handleFinish = () => {
    if (!name || !age || !role) return;
    saveProfile({ name, age, role, createdAt: new Date().toISOString() });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome to CommPractice
          </h1>
          <p className="text-muted-foreground">Let's set up your profile</p>
        </div>

        {step === 0 && (
          <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">What's your name?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-14 rounded-xl border-2 border-border bg-card px-4 text-lg focus:border-primary focus:outline-none"
            />
            <Button size="lg" className="w-full" disabled={!name.trim()} onClick={() => setStep(1)}>
              Next <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="age" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">How old are you?</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              min="1"
              max="120"
              className="w-full h-14 rounded-xl border-2 border-border bg-card px-4 text-lg focus:border-primary focus:outline-none"
            />
            <Button size="lg" className="w-full" disabled={!age} onClick={() => setStep(2)}>
              Next <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">What best describes you?</label>
            <div className="space-y-3">
              {roles.map((r) => (
                <Button
                  key={r.value}
                  variant="aac"
                  className={`w-full justify-start ${role === r.value ? "border-primary ring-2 ring-primary bg-primary/5" : ""}`}
                  onClick={() => setRole(r.value)}
                >
                  <span className="text-2xl mr-3">{r.icon}</span>
                  {r.label}
                </Button>
              ))}
            </div>
            <Button size="lg" variant="accent" className="w-full" disabled={!role} onClick={handleFinish}>
              Get Started 🚀
            </Button>
          </motion.div>
        )}

        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i === step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
