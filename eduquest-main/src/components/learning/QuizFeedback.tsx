import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

interface QuizFeedbackProps {
  percentage: number;
  passed: boolean;
  subjectName?: string;
  previousScore?: number | null;
}

const getSmartFeedback = (percentage: number, passed: boolean, subjectName?: string, previousScore?: number | null) => {
  const improved = previousScore !== null && previousScore !== undefined && percentage > previousScore;
  const declined = previousScore !== null && previousScore !== undefined && percentage < previousScore;
  const subject = subjectName || "this subject";

  if (percentage === 100) {
    return {
      emoji: "🌟",
      title: "Perfect Score!",
      message: `Incredible! You nailed every question in ${subject}!`,
      icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
      color: "text-yellow-600 dark:text-yellow-400",
    };
  }

  if (improved) {
    const diff = percentage - (previousScore ?? 0);
    return {
      emoji: "📈",
      title: `+${diff}% Improvement!`,
      message: `You improved in ${subject}! Keep going! 🎉`,
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      color: "text-green-600 dark:text-green-400",
    };
  }

  if (declined) {
    return {
      emoji: "💪",
      title: "Keep Practicing!",
      message: `Don't worry — review ${subject} and try again. You've got this!`,
      icon: <TrendingDown className="w-5 h-5 text-orange-500" />,
      color: "text-orange-600 dark:text-orange-400",
    };
  }

  if (passed) {
    if (percentage >= 90) {
      return {
        emoji: "🔥",
        title: "Outstanding!",
        message: `You're mastering ${subject}! Almost perfect!`,
        icon: <TrendingUp className="w-5 h-5 text-green-500" />,
        color: "text-green-600 dark:text-green-400",
      };
    }
    return {
      emoji: "✅",
      title: "Well Done!",
      message: `Great job on ${subject}! Keep up the momentum!`,
      icon: <Minus className="w-5 h-5 text-primary" />,
      color: "text-primary",
    };
  }

  return {
    emoji: "📚",
    title: "Almost There!",
    message: `Review ${subject} lessons and try again. Practice makes perfect!`,
    icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    color: "text-blue-600 dark:text-blue-400",
  };
};

const QuizFeedback = ({ percentage, passed, subjectName, previousScore }: QuizFeedbackProps) => {
  const feedback = getSmartFeedback(percentage, passed, subjectName, previousScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-4 p-4 rounded-xl bg-muted/50 border border-border"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{feedback.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {feedback.icon}
            <p className={`font-bold ${feedback.color}`}>{feedback.title}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{feedback.message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default QuizFeedback;
