import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, HelpCircle, Trophy, Star, ArrowRight, X } from "lucide-react";

const ONBOARDING_KEY = "eduspark_onboarding_done";

interface OnboardingTutorialProps {
    studentName: string;
}

const steps = [
    {
        emoji: "👋",
        title: "Welcome to EduSpark!",
        description: "Your learning adventure starts here. Let's show you around!",
        icon: Star,
        color: "from-primary/20 to-primary/10",
    },
    {
        emoji: "📚",
        title: "Pick a Subject",
        description: "Choose from subjects like Math, Science, Tamil, English, and more. Each has fun lessons waiting for you!",
        icon: BookOpen,
        color: "from-edu-purple/20 to-edu-purple/10",
    },
    {
        emoji: "📝",
        title: "Take Quizzes",
        description: "After each lesson, test what you learned with quizzes. Get instant feedback and explanations!",
        icon: HelpCircle,
        color: "from-edu-orange/20 to-edu-orange/10",
    },
    {
        emoji: "🏆",
        title: "Earn XP & Level Up",
        description: "Every lesson and quiz earns you XP. Climb the leaderboard and show your friends your progress!",
        icon: Trophy,
        color: "from-xp/20 to-xp/10",
    },
];

const OnboardingTutorial = ({ studentName }: OnboardingTutorialProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const done = localStorage.getItem(ONBOARDING_KEY);
        if (!done) setVisible(true);
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(ONBOARDING_KEY, "true");
        setVisible(false);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((s) => s + 1);
        } else {
            handleDismiss();
        }
    };

    if (!visible) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 relative"
                >
                    {/* Skip button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="text-center space-y-4">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto`}>
                            <span className="text-4xl">{step.emoji}</span>
                        </div>

                        {currentStep === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Hey {studentName.split(" ")[0]}! 🌟
                            </p>
                        )}

                        <h2 className="text-xl font-black">{step.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                        </p>

                        {/* Progress dots */}
                        <div className="flex items-center justify-center gap-2 pt-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentStep
                                            ? "bg-primary w-6"
                                            : i < currentStep
                                                ? "bg-primary/40"
                                                : "bg-muted-foreground/20"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            {currentStep > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentStep((s) => s - 1)}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                            )}
                            <Button onClick={handleNext} className="flex-1 gap-1">
                                {currentStep < steps.length - 1 ? (
                                    <>
                                        Next <ArrowRight className="w-4 h-4" />
                                    </>
                                ) : (
                                    "Let's Go! 🚀"
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default OnboardingTutorial;
