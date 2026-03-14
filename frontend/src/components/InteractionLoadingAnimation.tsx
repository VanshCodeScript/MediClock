import { motion } from "framer-motion";

interface InteractionLoadingAnimationProps {
  minDuration?: number;
}

const InteractionLoadingAnimation = ({
  minDuration = 2000,
}: InteractionLoadingAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-8"
    >
      {/* Video Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mb-6"
      >
        <video
          autoPlay
          loop
          muted
          className="w-full h-auto rounded-xl shadow-lg"
        >
          <source src="/loading.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </motion.div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-3"
      >
        <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
          Analyzing Drug Interactions
        </h3>

        <p className="text-base font-semibold text-gray-800 dark:text-gray-200 max-w-md">
          Checking medical databases and pharmacological data for potential drug
          interactions...
        </p>

        {/* Progress indicator with dots */}
        <motion.div className="flex justify-center gap-2 py-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-3 h-3 bg-blue-600 rounded-full"
            />
          ))}
        </motion.div>

        {/* Info text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 space-y-1 pt-2"
        >
          <p>🔍 Scanning interaction databases</p>
          <p>⚕️ Evaluating clinical evidence</p>
          <p>🎯 Computing risk scores</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default InteractionLoadingAnimation;
