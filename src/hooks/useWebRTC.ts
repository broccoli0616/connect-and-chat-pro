import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/firebase";
import {
  doc,
  collection,
  getDoc,
  updateDoc,
  addDoc,
  onSnapshot,
} from "firebase/firestore";

const FALLBACK_ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

async function getIceConfig(): Promise<RTCConfiguration> {
  try {
    const resp = await fetch("/api/turn-credentials");
    const iceServers = await resp.json();
    console.log("[WebRTC] TURN servers fetched:", iceServers.length, "servers");
    return { iceServers };
  } catch (err) {
    console.error("[WebRTC] Failed to fetch TURN servers, using STUN only:", err);
    return FALLBACK_ICE;
  }
}

export type ConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

interface UseWebRTCReturn {
  remoteStream: MediaStream | null;
  connectionState: ConnectionState;
  cleanup: () => void;
}

export function useWebRTC(
  roomId: string,
  localStream: MediaStream | null
): UseWebRTCReturn {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("new");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const unsubscribesRef = useRef<Array<() => void>>([]);
  const isMountedRef = useRef(true);
  const remoteDescSetRef = useRef(false);
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const startedRef = useRef(false);

  const cleanup = () => {
    isMountedRef.current = false;
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    remoteDescSetRef.current = false;
    iceCandidateBufferRef.current = [];
    startedRef.current = false;
  };

  useEffect(() => {
    isMountedRef.current = true;
    return cleanup;
  }, []);

  useEffect(() => {
    if (!localStream || !roomId || startedRef.current) return;
    startedRef.current = true;

    const startSignaling = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Determine role
      const roomRef = doc(db, "matchmaking_rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;

      const roomData = roomSnap.data();
      const isOfferer = roomData.player1 === uid;
      console.log(`[WebRTC] Role: ${isOfferer ? "OFFERER" : "ANSWERER"}, Room: ${roomId}`);

      // Create peer connection with STUN + TURN
      const iceConfig = await getIceConfig();
      const pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;

      // Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Receive remote tracks
      pc.ontrack = (event) => {
        console.log("[WebRTC] Remote track received:", event.track.kind);
        if (!isMountedRef.current) return;
        setRemoteStream(event.streams[0]);
      };

      // Track connection state (use both events for browser compatibility)
      const updateConnectionState = () => {
        if (!isMountedRef.current) return;
        const state = (pc.connectionState ?? pc.iceConnectionState) as ConnectionState;
        console.log("[WebRTC] Connection state:", state, "| ICE:", pc.iceConnectionState, "| Gathering:", pc.iceGatheringState);
        setConnectionState(state);
      };
      pc.onconnectionstatechange = updateConnectionState;
      pc.oniceconnectionstatechange = updateConnectionState;

      // ICE candidate subcollection names
      const myIceColl = isOfferer
        ? "iceCandidates_player1"
        : "iceCandidates_player2";
      const theirIceColl = isOfferer
        ? "iceCandidates_player2"
        : "iceCandidates_player1";

      // Send ICE candidates to Firestore
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[WebRTC] Sending ICE candidate:", event.candidate.type, event.candidate.protocol);
          addDoc(
            collection(db, "matchmaking_rooms", roomId, myIceColl),
            event.candidate.toJSON()
          );
        } else {
          console.log("[WebRTC] ICE gathering complete");
        }
      };

      // Listen for remote ICE candidates
      const unsubIce = onSnapshot(
        collection(db, "matchmaking_rooms", roomId, theirIceColl),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const candidate = change.doc.data() as RTCIceCandidateInit;
              if (remoteDescSetRef.current) {
                pc.addIceCandidate(new RTCIceCandidate(candidate));
              } else {
                iceCandidateBufferRef.current.push(candidate);
              }
            }
          });
        }
      );
      unsubscribesRef.current.push(unsubIce);

      const flushIceCandidates = () => {
        iceCandidateBufferRef.current.forEach((candidate) => {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
        iceCandidateBufferRef.current = [];
      };

      if (isOfferer) {
        // --- OFFERER FLOW ---
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await updateDoc(roomRef, {
          offer: { type: offer.type, sdp: offer.sdp },
        });
        console.log("[WebRTC] Offer created and sent to Firestore");

        setConnectionState("connecting");

        // Listen for answer
        const unsubRoom = onSnapshot(roomRef, (snapshot) => {
          const data = snapshot.data();
          if (data?.answer && !remoteDescSetRef.current) {
            console.log("[WebRTC] Answer received from Firestore");
            pc.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            ).then(() => {
              remoteDescSetRef.current = true;
              flushIceCandidates();
              console.log("[WebRTC] Remote description set, ICE candidates flushed");
            });
          }
        });
        unsubscribesRef.current.push(unsubRoom);
      } else {
        // --- ANSWERER FLOW ---
        setConnectionState("connecting");
        console.log("[WebRTC] Waiting for offer...");

        const unsubRoom = onSnapshot(roomRef, async (snapshot) => {
          const data = snapshot.data();
          if (data?.offer && !remoteDescSetRef.current) {
            console.log("[WebRTC] Offer received from Firestore");
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.offer)
            );
            remoteDescSetRef.current = true;
            flushIceCandidates();

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await updateDoc(roomRef, {
              answer: { type: answer.type, sdp: answer.sdp },
            });
            console.log("[WebRTC] Answer created and sent to Firestore");
          }
        });
        unsubscribesRef.current.push(unsubRoom);
      }
    };

    startSignaling().catch((err) => {
      console.error("WebRTC signaling error:", err);
      if (isMountedRef.current) setConnectionState("failed");
    });
  }, [localStream, roomId]);

  return { remoteStream, connectionState, cleanup };
}
