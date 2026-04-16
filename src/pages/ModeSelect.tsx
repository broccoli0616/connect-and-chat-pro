import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Users, ArrowLeft, BookOpen, MessageCircle, HeartHandshake, X, Heart, Smile, Globe, Sparkles } from "lucide-react";
import { getProfile } from "@/lib/userProfile";

interface ModeSelectProps {
  onSelectSingle: () => void;
  onSelectMulti: () => void;
  onBack: () => void;
}

// Expanded, high-quality communication articles
const LEARNING_RESOURCES = [
  {
    id: 1,
    title: "The F.O.R.D. Technique for Small Talk",
    category: "Quick Guide",
    icon: <MessageCircle className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80",
    source: "Based on classic Communication Psychology",
    content: "Stuck in an awkward silence? The F.O.R.D. technique is a classic communication strategy used by therapists, salespeople, and networking experts to keep conversations flowing naturally and build genuine rapport. It gives you an easy roadmap to follow when your mind goes blank.\n\nHere is how to break it down:\n\n👨‍👩‍👧 Family & Friends\nPeople love talking about their loved ones. \n• Ask: \"Do you have any family in the area?\" or \"How are your friends doing?\"\n• Why it works: It establishes common ground and shows you care about their personal circle.\n\n💼 Occupation\nWork or school is a huge part of our identities.\n• Ask: \"What's keeping you busy these days?\" or \"What do you enjoy most about your studies?\"\n• Why it works: It allows them to share their passions or vent mildly, both of which build connection.\n\n🏸 Recreation\nHobbies are where people's faces light up.\n• Ask: \"What do you do for fun when you're not working?\" or \"Have you watched any good shows lately?\"\n• Why it works: It shifts the mood to positive, exciting topics.\n\n💭 Dreams\nEveryone has aspirations.\n• Ask: \"If you could travel anywhere right now, where would you go?\" or \"What are you looking forward to this year?\"\n• Why it works: It elevates the conversation from mundane to inspiring.\n\n💡 Pro Tip: Avoid heavy topics (like politics or economics) until you know someone very well. Stick to FORD to keep things light, inclusive, and friendly!"
  },
  {
    id: 2,
    title: "Mastering Active Listening",
    category: "Deep Dive",
    icon: <BookOpen className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    source: "Adapted from Harvard Business Review",
    content: "Good communication isn't just about knowing what to say—it's about how well you listen. Most people do not listen with the intent to understand; they listen with the intent to reply. Active listening flips this script, making the other person feel incredibly valued.\n\nKey Principles of Active Listening:\n\n1. The 80/20 Rule\nAim to listen 80% of the time and speak 20% of the time. Let the other person be the star of the conversation.\n\n2. Non-Verbal Validation\nYour body speaks before your mouth does. \n• Maintain soft eye contact (don't stare, but definitely don't look at your phone).\n• Nod occasionally to show you are following along.\n• Lean in slightly to show engagement.\n\n3. The \"Mirroring\" Technique\nRepeat the last 1-3 words the person said as a gentle question. \n• Them: \"...and then the train was completely delayed!\"\n• You: \"Completely delayed?\"\nThis simple psychological trick encourages them to elaborate and makes them feel deeply heard without you having to come up with a complex response.\n\n4. Embrace the Silence\nWhen they finish speaking, count to two in your head before responding. People often pause to gather their thoughts, and if you stay quiet, they will fill that silence with even deeper, more meaningful details."
  },
  {
    id: 3,
    title: "How to Console: The Power of Validation",
    category: "Empathy",
    icon: <HeartHandshake className="w-4 h-4" />,
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=800&q=80",
    source: "Adapted from Psychology Today",
    content: "When someone we care about is upset, our natural human instinct is usually to \"fix\" the problem or point out the silver lining. However, psychological research shows that what people in distress actually need first is validation, not solutions.\n\n⚠️ The Trap of Toxic Positivity\nPhrases like \"Look on the bright side,\" \"Everything happens for a reason,\" or \"At least it isn't worse\" can accidentally invalidate a person's feelings, making them feel guilty for being upset.\n\n💚 The Power of Empathy\nEmpathy isn't about having the solution; it's about sitting with them in the dark. It is about acknowledging their reality.\n\nPhrases to Use Instead:\n• \"That sounds incredibly frustrating. I'm so sorry you're dealing with this.\"\n• \"It makes complete sense that you would feel that way.\"\n• \"I don't even know what to say right now, I'm just so glad you told me.\"\n• \"I'm here for you. Do you want me to help you find a solution, or do you just need to vent?\"\n\nBy acknowledging their pain without rushing to erase it, you build deep trust and a truly supportive, inclusive relationship."
  }
];

const ModeSelect = ({ onSelectSingle, onSelectMulti, onBack }: ModeSelectProps) => {
  const profile = getProfile();
  const [selectedArticle, setSelectedArticle] = useState<typeof LEARNING_RESOURCES[0] | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 font-sans pb-24 relative overflow-hidden">
      
      {/* --- BACKGROUND WATERMARKS --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <Heart className="absolute top-10 left-10 w-64 h-64 text-orange-500 opacity-[0.03] -rotate-12" />
        <Users className="absolute top-40 right-10 w-72 h-72 text-teal-500 opacity-[0.03] rotate-12" />
        <MessageCircle className="absolute bottom-20 left-12 w-80 h-80 text-indigo-500 opacity-[0.03] -rotate-6" />
        <Smile className="absolute bottom-40 right-20 w-56 h-56 text-pink-500 opacity-[0.03] rotate-6" />
        <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] text-primary opacity-[0.02]" />
        <Sparkles className="absolute top-1/4 left-1/3 w-32 h-32 text-yellow-500 opacity-[0.04] rotate-45" />
        <HeartHandshake className="absolute bottom-10 left-1/2 w-48 h-48 text-emerald-500 opacity-[0.03] -rotate-12" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-4xl space-y-12">
        
        {/* Top Header */}
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

        {/* --- SECTION 1: PRACTICE MODES --- */}
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
                      <p className="text-gray-500 leading-snug">Practice safely with our AI mascot guide in structured scenarios.</p>
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
                      <p className="text-gray-500 leading-snug">Connect instantly with a live partner to practice real interactions.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* --- SECTION 2: LEARNING HUB --- */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1.5 bg-indigo-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Communication Masterclass</h2>
          </div>
          <p className="text-gray-600 mb-6">Read up on quick, psychology-backed tips before you jump into a practice session.</p>
          
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
                  className="cursor-pointer overflow-hidden border border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-lg transition-all h-full bg-white/90 backdrop-blur-sm flex flex-col group"
                  onClick={() => setSelectedArticle(resource)}
                >
                  <div className="h-40 overflow-hidden relative flex-shrink-0">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                    <img src={resource.image} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-700 flex items-center gap-1.5 shadow-sm">
                      {resource.icon} {resource.category}
                    </div>
                  </div>
                  <CardContent className="p-5 flex-grow flex flex-col">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">{resource.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-grow">{resource.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      {/* Mobile Logout Button (Bottom) */}
      <div className="mt-12 md:hidden w-full max-w-md relative z-10">
        <Button variant="ghost" onClick={onBack} className="w-full text-gray-500 bg-white/50 backdrop-blur">
          <ArrowLeft className="w-4 h-4 mr-2" /> Log Out & Return Home
        </Button>
      </div>

      {/* --- ARTICLE MODAL (POPUP) --- */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="relative h-48 md:h-72 w-full">
                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Button 
                  size="icon"
                  variant="secondary"
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-900 rounded-full shadow-md"
                  onClick={() => setSelectedArticle(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 md:p-10">
                <div className="inline-flex items-center gap-1.5 text-indigo-700 font-semibold text-sm mb-3 bg-indigo-50 px-3 py-1 rounded-full">
                  {selectedArticle.icon} {selectedArticle.category}
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">{selectedArticle.title}</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-8">Source: {selectedArticle.source}</p>
                
                <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed text-base md:text-lg">
                  {selectedArticle.content}
                </div>

                <div className="mt-12 pt-6 border-t border-gray-100 text-center">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-14 text-lg" onClick={() => setSelectedArticle(null)}>
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