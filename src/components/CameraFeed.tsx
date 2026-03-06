import { useEffect, useRef, useState } from "react";
import { VideoOff } from "lucide-react";

const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setHasCamera(false));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!hasCamera) {
    return (
      <div className="w-full aspect-video rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <VideoOff className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Camera unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full aspect-video rounded-xl object-cover border-2 border-border shadow-md"
      style={{ transform: "scaleX(-1)" }}
    />
  );
};

export default CameraFeed;
