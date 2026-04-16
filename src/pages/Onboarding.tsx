import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveProfile, UserProfile } from "@/lib/userProfile";
import { User, ArrowRight, ArrowLeft } from "lucide-react";
import { auth, db } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore"; // <-- Added getDoc here!

interface OnboardingProps {
  onComplete: () => void;
}

const roles = [
  { value: "learner" as const, label: "I'm practising", icon: "🎓" },
  { value: "therapist" as const, label: "I'm a therapist", icon: "💼" },
];

const languages = [
  { value: "en-US" as const, label: "English" },
  { value: "zh-CN" as const, label: "Chinese (Simplified)" },
];

type AuthMode = "chooser" | "sign-in" | "register";

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [view, setView] = useState<"initial" | "login" | "register">("initial");
  const [step, setStep] = useState(0);
  
  // Form State
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [signInName, setSignInName] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [role, setRole] = useState<UserProfile["role"] | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // FETCH THE REAL TAG FROM THE DATABASE
      let userRole = "learner"; // default fallback
      try {
        const userDoc = await getDoc(doc(db, "users", cred.user.uid));
        if (userDoc.exists() && userDoc.data().role) {
          userRole = userDoc.data().role;
        }
      } catch (dbErr) {
        console.error("Could not fetch user role, defaulting to learner", dbErr);
      }

      // Save the REAL profile so the app knows who we are
      saveProfile({ 
        name: email.split('@')[0], 
        age: "25", 
        role: userRole as UserProfile["role"], 
        createdAt: new Date().toISOString() 
      });
      
      onComplete();
    } catch (err: any) {
      setError("Invalid email or password.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !role || !email || !password) return;
    setError("");
    setIsLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      setDoc(doc(db, "users", cred.user.uid), {
        name, age, role, email, createdAt: new Date()
      }).catch(err => console.error("Database save delayed:", err));

      saveProfile({ name, age, role: role as UserProfile["role"], createdAt: new Date().toISOString() });
      
      onComplete();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSubmitFakeSignIn = () => {
    const normalizedName = signInName.trim().toLowerCase();
    if (!normalizedName || !password.trim()) {
      setSignInError("Enter both username and password.");
      return;
    }

    const matchedProfile = savedProfiles.find(
      (profile) => profile.name.trim().toLowerCase() === normalizedName
    );

    if (!matchedProfile) {
      setSignInError("No saved profile matches that username. Register first or try a saved name.");
      return;
    }

    setSignInError("");
    handleSignIn(matchedProfile);
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
          <p className="text-muted-foreground">
            {view === 'initial' ? "Let's get started" : view === 'login' ? "Welcome back" : "Let's set up your profile"}
          </p>
        </div>

        {view === "initial" && (
          <motion.div key="initial" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <Button size="lg" className="w-full" onClick={() => setView("login")}>
              Log In
            </Button>
            <div className="text-center text-sm text-muted-foreground my-2">or</div>
            <Button size="lg" variant="outline" className="w-full" onClick={() => setView("register")}>
              Create a New Profile
            </Button>
          </motion.div>
        )}

        {view === "login" && (
          <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full h-14 rounded-xl border-2 border-border bg-card px-4 text-lg focus:border-primary focus:outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full h-14 rounded-xl border-2 border-border bg-card px-4 text-lg focus:border-primary focus:outline-none"
              />
              <Button size="lg" className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </form>
            <Button variant="ghost" className="w-full mt-2" onClick={() => setView("initial")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </motion.div>
        )}

        {view === "register" && step === 0 && (
          <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">What's your name?</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="h-14 rounded-xl border-2 border-border bg-card px-4 text-lg"
            />
            <Button size="lg" className="w-full" disabled={!name.trim()} onClick={() => setStep(1)}>
              Next <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setView("initial")}>Back</Button>
          </motion.div>
        )}

        {view === "register" && step === 1 && (
          <motion.div key="age" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">How old are you?</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              min="1"
              max="120"
              className="h-14 rounded-xl border-2 border-border bg-card px-4 text-lg"
            />
            <div className="flex gap-2">
              <Button size="lg" variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button size="lg" className="flex-1" disabled={!age} onClick={() => setStep(2)}>
                Next <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {view === "register" && step === 2 && (
          <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">What best describes you?</label>
            <div className="space-y-3">
              {roles.map((r) => (
                <Button
                  key={r.value}
                  variant="outline"
                  className={`w-full justify-start h-14 ${role === r.value ? "border-primary ring-2 ring-primary bg-primary/5" : ""}`}
                  onClick={() => setRole(r.value)}
                >
                  <span className="text-2xl mr-3">{r.icon}</span>
                  {r.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="lg" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" className="flex-1" disabled={!role} onClick={() => setStep(3)}>
                Next <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {view === "register" && step === 3 && (
          <motion.div key="credentials" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">Secure your account</label>
            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full h-14 rounded-xl border-2 border-border bg-card px-4 text-lg focus:border-primary focus:outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                required
                minLength={6}
                className="w-full h-14 rounded-xl border-2 border-border bg-card px-4 text-lg focus:border-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <Button size="lg" variant="outline" type="button" onClick={() => setStep(2)}>Back</Button>
                <Button size="lg" className="flex-1" type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Finish 🚀"}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {view === "register" && (
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i === step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;