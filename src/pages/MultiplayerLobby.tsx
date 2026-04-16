import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ArrowLeft, Loader2, Search, AlertCircle, Clock } from "lucide-react";
import { getProfile } from "@/lib/userProfile";
import { auth, db } from "@/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, doc, deleteDoc, serverTimestamp } from "firebase/firestore";

interface MultiplayerLobbyProps {
  onBack: () => void;
  onMatchFound: (roomId: string) => void;
}

export default function MultiplayerLobby({ onBack, onMatchFound }: MultiplayerLobbyProps) {
  const profile = getProfile();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  
  // Timer State (2 minutes = 120 seconds)
  const [timeLeft, setTimeLeft] = useState(120);

  const [myRoomId, setMyRoomId] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * 33) + 12);
  }, []);

  // Countdown Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isSearching && timeLeft <= 0) {
      handleTimeout();
    }
    return () => clearInterval(interval);
  }, [isSearching, timeLeft]);

  const handleTimeout = async () => {
    setIsSearching(false);
    setSearchError("Cannot find a match, sorry. Please try again later.");
    
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    
    if (myRoomId) {
      try {
        await deleteDoc(doc(db, "matchmaking_rooms", myRoomId));
      } catch (e) {
        console.error("Failed to clean up room", e);
      }
      setMyRoomId(null);
    }
  };

  const startMatchmaking = async () => {
    setIsSearching(true);
    setSearchError("");
    setTimeLeft(120); // Reset timer to 2 mins

    if (!auth.currentUser) {
      setSearchError("You must be logged in to matchmake.");
      setIsSearching(false);
      return;
    }

    const roomsRef = collection(db, "matchmaking_rooms");

    try {
      const q = query(roomsRef, where("status", "==", "waiting"));
      const querySnapshot = await getDocs(q);

      let joinedExisting = false;

      // 1. Look for a room that we DID NOT create ourselves
      for (const roomDoc of querySnapshot.docs) {
        const roomData = roomDoc.data();
        
        if (roomData.player1 !== auth.currentUser.uid) {
          // MATCH FOUND!
          await updateDoc(doc(db, "matchmaking_rooms", roomDoc.id), {
            status: "matched",
            player2: auth.currentUser.uid
          });
          joinedExisting = true;
          onMatchFound(roomDoc.id);
          return; 
        }
      }

      if (joinedExisting) return;

      // 2. NO OTHER ROOMS FOUND: Create a new room and wait
      const newRoom = await addDoc(roomsRef, {
        status: "waiting",
        player1: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      setMyRoomId(newRoom.id);

      // 3. Listen to the room for someone else to join
      const unsubscribe = onSnapshot(doc(db, "matchmaking_rooms", newRoom.id), (snapshot) => {
        const data = snapshot.data();
        if (data && data.status === "matched") {
          if (unsubRef.current) unsubRef.current(); // Stop listening
          onMatchFound(newRoom.id); // Go to room!
        }
      });

      unsubRef.current = unsubscribe;

    } catch (err) {
      console.error(err);
      setSearchError("Matchmaking failed. Check connection.");
      setIsSearching(false);
    }
  };

  const cancelSearch = async () => {
    setIsSearching(false);
    setSearchError("");
    
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    
    if (myRoomId) {
      try {
        await deleteDoc(doc(db, "matchmaking_rooms", myRoomId));
      } catch (e) {}
      setMyRoomId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-teal-50 mx-auto flex items-center justify-center mb-6 shadow-inner">
            <Users className="w-10 h-10 text-teal-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Multiplayer Lobby</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            {onlineCount} players currently online
          </p>
        </div>

        <Card className="border-2 border-teal-100 shadow-lg overflow-hidden">
          <CardContent className="p-8 text-center bg-white">
            
            {searchError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex flex-col items-center gap-2 border border-red-100">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <p className="font-medium text-sm">{searchError}</p>
              </div>
            )}

            {!isSearching ? (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Ready to practice, <span className="font-semibold text-teal-700 capitalize">{profile?.role || "learner"}</span>? 
                  We will pair you with an available partner.
                </p>
                <Button size="lg" onClick={startMatchmaking} className="w-full h-14 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-md">
                  <Search className="w-5 h-5 mr-2" /> Find a Partner
                </Button>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="relative w-16 h-16 mx-auto">
                  <Loader2 className="w-16 h-16 text-teal-500 animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Searching for a match...</h3>
                  <div className="flex items-center justify-center gap-2 text-teal-700 font-mono bg-teal-50 py-2 px-4 rounded-full w-fit mx-auto border border-teal-100 mb-4">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg font-semibold">{formatTime(timeLeft)}</span>
                  </div>
                  <p className="text-gray-500 text-sm">Looking for available players in your region</p>
                </div>
                <Button variant="outline" size="lg" onClick={cancelSearch} className="w-full mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                  Cancel Search
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={onBack} disabled={isSearching}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
