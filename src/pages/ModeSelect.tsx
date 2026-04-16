import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Users,
  ArrowLeft,
  MessageCircle,
  X,
  Heart,
  Smile,
  Globe,
  Sparkles,
  HeartHandshake,
  Keyboard,
  Hand,
  Volume2,
  Ear,
  CheckCircle2,
  Clock3,
  CircleHelp,
  Speaker,
} from "lucide-react";
import { getProfile } from "@/lib/userProfile";

interface ModeSelectProps {
  onSelectSingle: () => void;
  onSelectMulti: () => void;
  onBack: () => void;
}

interface LearningSection {
  title: string;
  icon: JSX.Element;
  content?: string[];
  bullets?: string[];
}

interface LearningResource {
  id: number;
  tag: string;
  title: string;
  preview: string;
  articleTitle: string;
  intro: string;
  summary: string;
  icon: JSX.Element;
  accent: string;
  imageLabels: string[];
  visualNote: string;
  takeaway: string;
  sections: LearningSection[];
}

const LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 1,
    tag: "Quick Guide",
    title: "What Is AAC?",
    preview:
      "AAC means Augmentative and Alternative Communication. It includes pictures, typing, buttons, gestures, and speech devices.",
    articleTitle: "What Is AAC? Different Ways to Communicate",
    intro:
      "Not everyone communicates in the same way. Some people speak with their voice. Some people type. Some use pictures, buttons, gestures, or communication devices. All of these are valid ways to communicate.",
    summary: "AAC gives people more ways to express themselves in everyday life.",
    icon: <MessageCircle className="w-4 h-4" />,
    accent: "from-orange-100 via-amber-50 to-white",
    imageLabels: ["Speaking", "Typing", "Pictures", "Gestures", "Device"],
    visualNote: "Simple visual support can make communication feel easier and more confident.",
    takeaway: "Different ways to communicate are all real communication.",
    sections: [
      {
        title: "AAC in simple words",
        icon: <MessageCircle className="w-5 h-5 text-orange-600" />,
        content: [
          "AAC stands for Augmentative and Alternative Communication.",
          "It includes tools and methods that help someone express themselves.",
          "AAC can be used all the time, or only in some situations.",
        ],
        bullets: [
          "pictures",
          "symbol boards",
          "text-to-speech apps",
          "typing",
          "gestures",
          "pointing",
          "speech devices",
        ],
      },
      {
        title: "AAC is still communication",
        icon: <Speaker className="w-5 h-5 text-orange-600" />,
        content: [
          "Using AAC does not mean a person has less to say.",
          "It simply means they may express themselves in a different way.",
          "Communication can be spoken, typed, shown, selected, or signaled.",
        ],
      },
      {
        title: "There is no one right way",
        icon: <Hand className="w-5 h-5 text-orange-600" />,
        content: [
          "Everyone's communication style is different.",
          "Some people want more time.",
          "Some people use short phrases.",
          "Some people prefer visuals.",
          "Some people switch between methods.",
          "That is okay.",
        ],
      },
    ],
  },
  {
    id: 2,
    tag: "Empathy",
    title: "Make Communication Easier",
    preview:
      "Good communication is not about being fast. Time, clear words, and patient listening can help a lot.",
    articleTitle: "How to Make Communication Easier",
    intro:
      "Communication works best when everyone feels respected and understood. Small changes can make a big difference.",
    summary: "Helpful communication is slow enough, clear enough, and kind enough for both people.",
    icon: <HeartHandshake className="w-4 h-4" />,
    accent: "from-teal-100 via-emerald-50 to-white",
    imageLabels: ["Wait", "Listen", "Clear words", "Check understanding"],
    visualNote: "Supportive communication gives people space to respond in their own way.",
    takeaway: "Helpful communication is patient, clear, and respectful.",
    sections: [
      {
        title: "Give time",
        icon: <Clock3 className="w-5 h-5 text-teal-700" />,
        content: [
          "Some people need more time to process, type, point, or respond.",
          "Do not rush.",
          "A pause does not mean the person has nothing to say.",
        ],
      },
      {
        title: "Use clear language",
        icon: <MessageCircle className="w-5 h-5 text-teal-700" />,
        content: [
          "Short, clear sentences are often easier to understand.",
          "Say one idea at a time.",
          "Avoid saying too many things at once.",
        ],
        bullets: [
          "Do you want help?",
          "Please tell me again.",
          "Take your time.",
          "Can I show you the options?",
        ],
      },
      {
        title: "Respect all responses",
        icon: <Ear className="w-5 h-5 text-teal-700" />,
        content: [
          "A response may come through speech, typing, pointing, facial expression, gesture, or a device.",
          "Pay attention to the person's preferred way of communicating.",
        ],
      },
      {
        title: "Check understanding kindly",
        icon: <CheckCircle2 className="w-5 h-5 text-teal-700" />,
        content: ["It helps to gently check if both people understand each other."],
        bullets: [
          "Did I get that right?",
          "Do you mean this?",
          "Would pictures help?",
          "Can we try again together?",
        ],
      },
    ],
  },
  {
    id: 3,
    tag: "Deep Dive",
    title: "Useful Phrases for Real Life",
    preview:
      "Practise simple phrases for asking for help, ordering food, waiting, or saying you do not understand.",
    articleTitle: "Useful Phrases for Everyday Communication",
    intro:
      "Real-life communication can feel stressful. Simple phrases can help people start, respond, and ask for support in everyday situations.",
    summary: "Short phrases can make everyday communication easier and more confident.",
    icon: <CircleHelp className="w-4 h-4" />,
    accent: "from-indigo-100 via-sky-50 to-white",
    imageLabels: ["Help", "Food", "Not clear", "Needs"],
    visualNote: "Short phrase buttons can support quick choices in busy real-life moments.",
    takeaway: "Simple phrases can make everyday communication easier and more confident.",
    sections: [
      {
        title: "Asking for help",
        icon: <HeartHandshake className="w-5 h-5 text-indigo-700" />,
        bullets: [
          "Can you help me?",
          "I need help.",
          "Please wait.",
          "Can you show me?",
          "Can you say that again?",
        ],
      },
      {
        title: "At a shop or food place",
        icon: <MessageCircle className="w-5 h-5 text-indigo-700" />,
        bullets: [
          "I want this.",
          "This one, please.",
          "No spicy.",
          "Take away, please.",
          "How much is this?",
        ],
      },
      {
        title: "When something is not clear",
        icon: <CircleHelp className="w-5 h-5 text-indigo-700" />,
        bullets: [
          "I don't understand.",
          "Please say it again.",
          "Please speak slowly.",
          "Can I have more time?",
          "That is not what I meant.",
        ],
      },
      {
        title: "Expressing needs",
        icon: <Hand className="w-5 h-5 text-indigo-700" />,
        bullets: [
          "I need a break.",
          "I am not ready yet.",
          "Please give me time.",
          "I want to do it myself.",
          "Yes.",
          "No.",
        ],
      },
    ],
  },
];

const ModeSelect = ({ onSelectSingle, onSelectMulti, onBack }: ModeSelectProps) => {
  const profile = getProfile();
  const [selectedArticle, setSelectedArticle] = useState<LearningResource | null>(null);
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  const canReadAloud = typeof window !== "undefined" && "speechSynthesis" in window;

  const articleSpeechText = useMemo(() => {
    if (!selectedArticle) return "";

    return [
      selectedArticle.articleTitle,
      selectedArticle.summary,
      selectedArticle.intro,
      ...selectedArticle.sections.flatMap((section) => [
        section.title,
        ...(section.content ?? []),
        ...(section.bullets ?? []),
      ]),
      selectedArticle.takeaway,
    ].join(". ");
  }, [selectedArticle]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCloseArticle = () => {
    if (canReadAloud) {
      window.speechSynthesis.cancel();
    }
    setIsReadingAloud(false);
    setSelectedArticle(null);
  };

  const handleReadAloud = () => {
    if (!selectedArticle || !canReadAloud) return;

    if (isReadingAloud) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(articleSpeechText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsReadingAloud(false);
    utterance.onerror = () => setIsReadingAloud(false);

    window.speechSynthesis.cancel();
    setIsReadingAloud(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 font-sans pb-24 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <Heart className="absolute top-10 left-10 w-64 h-64 text-orange-500 opacity-[0.03] -rotate-12" />
        <Users className="absolute top-40 right-10 w-72 h-72 text-teal-500 opacity-[0.03] rotate-12" />
        <MessageCircle className="absolute bottom-20 left-12 w-80 h-80 text-indigo-500 opacity-[0.03] -rotate-6" />
        <Smile className="absolute bottom-40 right-20 w-56 h-56 text-pink-500 opacity-[0.03] rotate-6" />
        <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] text-primary opacity-[0.02]" />
        <Sparkles className="absolute top-1/4 left-1/3 w-32 h-32 text-yellow-500 opacity-[0.04] rotate-45" />
        <HeartHandshake className="absolute bottom-10 left-1/2 w-48 h-48 text-emerald-500 opacity-[0.03] -rotate-12" />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-4 mb-10 flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-1">
              Hi, {profile?.name || "there"}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Welcome to your communication dashboard.
            </p>
          </div>
          <Button variant="outline" onClick={onBack} className="hidden md:flex bg-white shadow-sm hover:bg-gray-50 z-20">
            <ArrowLeft className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </motion.div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1.5 bg-orange-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Live Practice Modes</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="cursor-pointer border-2 border-transparent hover:border-orange-500 transition-all shadow-md hover:shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden group" onClick={onSelectSingle}>
                <CardContent className="p-0">
                  <div className="p-6 md:p-8 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <User className="w-10 h-10 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">Solo Practice</h2>
                      <p className="text-gray-600 leading-snug">Practice safely with our AI mascot guide in structured scenarios.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="cursor-pointer border-2 border-transparent hover:border-teal-500 transition-all shadow-md hover:shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden group" onClick={onSelectMulti}>
                <CardContent className="p-0">
                  <div className="p-6 md:p-8 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-10 h-10 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">Multiplayer</h2>
                      <p className="text-gray-600 leading-snug">Connect instantly with a live partner to practice real interactions.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1.5 bg-indigo-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Communication Support Library</h2>
          </div>
          <p className="text-gray-700 mb-6 max-w-3xl leading-relaxed">
            Short, supportive guides for different communication styles, including AAC, gestures, typing, and spoken language.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {LEARNING_RESOURCES.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card
                  className="cursor-pointer overflow-hidden border border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-lg transition-all h-full bg-white/95 backdrop-blur-sm flex flex-col group"
                  onClick={() => setSelectedArticle(resource)}
                >
                  <div className={`p-5 bg-gradient-to-br ${resource.accent} border-b border-gray-100`}>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-800 shadow-sm">
                      {resource.icon}
                      <span>{resource.tag}</span>
                    </div>
                    <div className="mt-4 rounded-2xl bg-white/80 p-4 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        {resource.imageLabels.map((label) => (
                          <div
                            key={label}
                            className="min-h-[4.75rem] rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm font-medium leading-snug text-gray-700 text-center flex items-center justify-center break-words"
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5 flex-grow flex flex-col gap-3">
                    <h3 className="font-display text-2xl font-bold text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed flex-grow">{resource.preview}</p>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      {resource.visualNote}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 md:hidden w-full max-w-md relative z-10">
        <Button variant="ghost" onClick={onBack} className="w-full text-gray-600 bg-white/70 backdrop-blur">
          <ArrowLeft className="w-4 h-4 mr-2" /> Log Out & Return Home
        </Button>
      </div>

      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
            onClick={handleCloseArticle}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 md:p-8 bg-gradient-to-br ${selectedArticle.accent} border-b border-gray-100`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4 bg-white/85 px-3 py-1 rounded-full">
                      {selectedArticle.icon}
                      <span>{selectedArticle.tag}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 leading-tight">
                      {selectedArticle.articleTitle}
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-gray-700 max-w-2xl leading-relaxed">
                      {selectedArticle.intro}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-white/80 hover:bg-white text-gray-900 rounded-full shadow-md flex-shrink-0"
                    onClick={handleCloseArticle}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReadAloud}
                    disabled={!canReadAloud}
                    className="bg-white/85 text-gray-800 border-white/80 hover:bg-white"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    {isReadingAloud ? "Stop Reading" : "Read Aloud"}
                  </Button>
                  <Button
                    type="button"
                    onClick={onSelectSingle}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Practice This Next
                  </Button>
                </div>
              </div>

              <div className="p-6 md:p-10">
                <div className="rounded-3xl border border-indigo-100 bg-indigo-50 px-5 py-4 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 mb-2">Quick Summary</p>
                  <p className="text-base md:text-lg text-indigo-950 leading-relaxed">{selectedArticle.summary}</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                  {selectedArticle.imageLabels.map((label) => (
                    <div
                      key={label}
                      className="min-h-[7rem] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center flex items-center justify-center"
                    >
                      <p className="text-sm font-semibold leading-snug text-gray-800 max-w-[10ch] mx-auto">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-6 max-w-2xl">
                  {selectedArticle.sections.map((section) => (
                    <section key={section.title} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="rounded-2xl bg-gray-50 p-2">{section.icon}</div>
                        <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
                      </div>

                      {section.content && (
                        <div className="space-y-3 mb-4">
                          {section.content.map((paragraph) => (
                            <p key={paragraph} className="text-base text-gray-700 leading-relaxed max-w-prose">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}

                      {section.bullets && (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {section.bullets.map((bullet) => (
                            <div key={bullet} className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                              <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                              <span className="text-base text-gray-800 leading-relaxed">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">Key Takeaway</p>
                  <p className="text-lg font-semibold text-emerald-950">{selectedArticle.takeaway}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-14 text-lg" onClick={handleCloseArticle}>
                    Done Reading
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeSelect;
