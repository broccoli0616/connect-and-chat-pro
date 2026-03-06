import { motion } from "framer-motion";

interface MascotAvatarProps {
  isSpeaking: boolean;
  message: string;
}

const MascotAvatar = ({ isSpeaking, message }: MascotAvatarProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="w-28 h-28 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-6xl"
        animate={isSpeaking ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={isSpeaking ? { repeat: Infinity, duration: 0.6 } : {}}
      >
        🧑‍✈️
      </motion.div>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          key={message}
          className="bg-card border-2 border-primary/20 rounded-2xl px-5 py-3 max-w-sm text-center shadow-md"
        >
          <p className="text-base font-medium text-foreground">{message}</p>
        </motion.div>
      )}
    </div>
  );
};

export default MascotAvatar;
