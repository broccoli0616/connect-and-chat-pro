import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, CheckCircle2 } from "lucide-react";
import { getProfile } from "@/lib/userProfile";
import { auth, db } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface PostMatchFeedbackProps {
  roomId: string | null;
  onComplete: () => void;
}

export default function PostMatchFeedback({ roomId, onComplete }: PostMatchFeedbackProps) {
  const profile = getProfile();
  const isLearner = profile?.role === "learner";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Learner State
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [learnerComments, setLearnerComments] = useState("");

  // Support Partner / Therapist State
  const [metrics, setMetrics] = useState({
    confidence: 0,
    clarity: 0,
    pace: 0,
    flow: 0, 
  });
  const [partnerComments, setPartnerComments] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      if (roomId && auth.currentUser) {
        // Create a reference to a document with the exact call's ID
        const docRef = doc(db, "call_feedbacks", roomId);
        
        const roleKey = isLearner ? "learner_feedback" : "support_partner_feedback";
        
        const feedbackPayload = isLearner 
          ? { satisfaction, comments: learnerComments } 
          : { metrics, comments: partnerComments };

        // { merge: true } is the magic. It means if the other person already 
        // submitted their half, this won't overwrite it! It just adds to it.
        await setDoc(docRef, {
          [roleKey]: {
            userId: auth.currentUser.uid,
            ...feedbackPayload,
            submittedAt: serverTimestamp()
          },
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }
      
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentValue: number, onClick: (val: number) => void) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onClick(star)}
            className={`transition-all ${star <= currentValue ? "text-orange-400 scale-110" : "text-gray-200 hover:text-orange-200"}`}
          >
            <Star className="w-8 h-8 md:w-10 md:h-10" fill={star <= currentValue ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
          <CheckCircle2 className="w-24 h-24 text-teal-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-foreground mb-3">Thank You!</h2>
          <p className="text-muted-foreground mb-8 text-lg">Your feedback helps make practice sessions better for everyone.</p>
          <Button size="lg" onClick={onComplete} className="w-full bg-teal-600 hover:bg-teal-700 text-lg h-14 rounded-xl shadow-md">
            Return to Mode Selection
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Session Complete
          </h1>
          <p className="text-muted-foreground text-lg">
            Take a moment to reflect on your practice session.
          </p>
        </div>

        <Card className="border-2 border-gray-100 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6 md:p-8 bg-white">
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* --- LEARNER TUNNEL --- */}
              {isLearner ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <label className="block text-xl font-bold text-gray-900 mb-6">
                      How satisfied were you with this session?
                    </label>
                    <div className="flex justify-center mb-2">
                      {renderStars(satisfaction, setSatisfaction)}
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      {satisfaction === 0 ? "Select a rating" : satisfaction <= 2 ? "It was tough, but I'm trying!" : satisfaction === 3 ? "It went okay." : "I feel great about it!"}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block font-semibold text-gray-900 mb-2">How are you feeling? (Optional)</label>
                    <textarea
                      value={learnerComments}
                      onChange={(e) => setLearnerComments(e.target.value)}
                      placeholder="Was there anything you struggled with? Any wins you want to celebrate?"
                      className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:outline-none min-h-[120px] transition-all"
                    />
                  </div>
                </div>
              ) : (
                
              /* --- SUPPORT PARTNER TUNNEL --- */
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900">Feedback for the Learner</h3>
                    <p className="text-sm text-gray-500 mt-1">Your constructive feedback builds their confidence.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                      <span className="font-semibold text-gray-700">Confidence Level</span>
                      {renderStars(metrics.confidence, (val) => setMetrics({ ...metrics, confidence: val }))}
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                      <span className="font-semibold text-gray-700">Clarity of Speech</span>
                      {renderStars(metrics.clarity, (val) => setMetrics({ ...metrics, clarity: val }))}
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                      <span className="font-semibold text-gray-700">Conversational Pace</span>
                      {renderStars(metrics.pace, (val) => setMetrics({ ...metrics, pace: val }))}
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                      <span className="font-semibold text-gray-700">Conversational Flow</span>
                      {renderStars(metrics.flow, (val) => setMetrics({ ...metrics, flow: val }))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-900 mb-2">Encouragement & Notes (Optional)</label>
                    <textarea
                      value={partnerComments}
                      onChange={(e) => setPartnerComments(e.target.value)}
                      placeholder="Write encouraging feedback or suggest specific areas for improvement..."
                      className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[120px] transition-all"
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className={`w-full text-lg h-14 rounded-xl shadow-md transition-all ${isLearner ? 'bg-orange-500 hover:bg-orange-600' : 'bg-teal-600 hover:bg-teal-700'}`}
                disabled={isSubmitting || (isLearner && satisfaction === 0)}
              >
                {isSubmitting ? "Saving..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}