import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, ArrowRight, LogIn, User, UserPlus } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

type Role = "learner" | "therapist";
type Language = "en-US" | "zh-CN";

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
  const { signUp, signIn, isOfflineMode, offlineSignIn } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>("chooser");
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<Role | "">("");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>("en-US");

  // In offline mode, registration has 3 steps (no email/password step)
  const totalRegisterSteps = isOfflineMode ? 3 : 4;

  const resetRegistration = () => {
    setStep(0);
    setName("");
    setAge("");
    setEmail("");
    setRegisterPassword("");
    setRole("");
    setPreferredLanguage("en-US");
  };

  const handleChooseRegister = () => {
    resetRegistration();
    setAuthError("");
    setAuthMode("register");
  };

  const handleChooseSignIn = () => {
    setSignInEmail("");
    setSignInPassword("");
    setAuthError("");
    setAuthMode("sign-in");
  };

  const handleFinishOffline = () => {
    if (!name || !age || !role) return;
    offlineSignIn({ name, age, role, preferredLanguage });
    onComplete();
  };

  const handleFinishOnline = async () => {
    if (!name || !age || !role || !email || !registerPassword) return;
    setIsSubmitting(true);
    setAuthError("");

    const { error } = await signUp(email, registerPassword, {
      name,
      age: parseInt(age, 10) || null,
      role,
      preferred_language: preferredLanguage,
    });

    setIsSubmitting(false);

    if (error) {
      setAuthError(error);
      return;
    }
    onComplete();
  };

  const handleSubmitSignIn = async () => {
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setAuthError("Enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setAuthError("");

    const { error } = await signIn(signInEmail, signInPassword);
    setIsSubmitting(false);

    if (error) {
      setAuthError(error);
      return;
    }
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
          <p className="text-muted-foreground">
            {authMode === "chooser"
              ? isOfflineMode
                ? "Sign in to continue or create a new profile"
                : "Sign in to continue or create a new account"
              : authMode === "sign-in"
                ? isOfflineMode
                  ? "Use a username and password to continue"
                  : "Sign in with your email and password"
                : "Create your profile to get started"}
          </p>
        </div>

        {authMode === "chooser" && (
          <motion.div
            key="chooser"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {!isOfflineMode && (
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card
                  className="cursor-pointer border-2 hover:border-primary transition-colors"
                  onClick={handleChooseSignIn}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <LogIn className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">Sign In</h2>
                      <p className="text-sm text-muted-foreground">
                        Continue with your existing account.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div whileTap={{ scale: 0.98 }}>
              <Card
                className="cursor-pointer border-2 hover:border-primary transition-colors"
                onClick={handleChooseRegister}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">
                      {isOfflineMode ? "Get Started" : "Register"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Create a new learner or therapist profile.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {authMode === "sign-in" && !isOfflineMode && (
          <motion.div
            key="sign-in"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Email</label>
                  <Input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Password</label>
                  <Input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 rounded-xl"
                  />
                </div>

                {authError && <p className="text-sm text-destructive">{authError}</p>}

                <Button
                  variant="accent"
                  className="w-full"
                  disabled={!signInEmail.trim() || !signInPassword.trim() || isSubmitting}
                  onClick={handleSubmitSignIn}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </CardContent>
            </Card>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setAuthError("");
                setAuthMode("chooser");
              }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </motion.div>
        )}

        {/* Step 0: Name */}
        {authMode === "register" && step === 0 && (
          <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">What's your name?</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="h-14 rounded-xl border-2 border-border bg-card px-4 text-lg"
            />
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setAuthMode("chooser")}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button size="lg" className="flex-1" disabled={!name.trim()} onClick={() => setStep(1)}>
                Next <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Age */}
        {authMode === "register" && step === 1 && (
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
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(0)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button size="lg" className="flex-1" disabled={!age} onClick={() => setStep(2)}>
                Next <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Role + Language */}
        {authMode === "register" && step === 2 && (
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
            <div className="pt-2">
              <label className="block text-sm font-semibold text-foreground mb-2">Preferred language</label>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((language) => (
                  <Button
                    key={language.value}
                    type="button"
                    variant="outline"
                    className={`w-full ${
                      preferredLanguage === language.value
                        ? "border-primary ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => setPreferredLanguage(language.value)}
                  >
                    {language.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              {isOfflineMode ? (
                <Button size="lg" variant="accent" className="flex-1" disabled={!role} onClick={handleFinishOffline}>
                  Get Started
                </Button>
              ) : (
                <Button size="lg" className="flex-1" disabled={!role} onClick={() => setStep(3)}>
                  Next <ArrowRight className="w-5 h-5" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Email + Password (online only) */}
        {authMode === "register" && step === 3 && !isOfflineMode && (
          <motion.div key="credentials" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground">Create your account</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-14 rounded-xl border-2 border-border bg-card px-4 text-lg"
            />
            <Input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="h-14 rounded-xl border-2 border-border bg-card px-4 text-lg"
            />
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                size="lg"
                variant="accent"
                className="flex-1"
                disabled={!email.trim() || !registerPassword.trim() || isSubmitting}
                onClick={handleFinishOnline}
              >
                {isSubmitting ? "Creating..." : "Get Started"}
              </Button>
            </div>
          </motion.div>
        )}

        {authMode === "register" && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalRegisterSteps }, (_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i === step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;
