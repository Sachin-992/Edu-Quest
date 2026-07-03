import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
    "#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
    "#85C1E9", "#F0B27A", "#82E0AA", "#F1948A", "#AED6F1",
];

interface Particle {
    id: number;
    x: number;
    color: string;
    delay: number;
    rotation: number;
    size: number;
}

interface ConfettiCelebrationProps {
    show: boolean;
}

const ConfettiCelebration = ({ show }: ConfettiCelebrationProps) => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (!show) {
            setParticles([]);
            return;
        }

        const newParticles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            delay: Math.random() * 0.5,
            rotation: Math.random() * 360,
            size: 6 + Math.random() * 6,
        }));

        setParticles(newParticles);

        const timeout = setTimeout(() => setParticles([]), 3000);
        return () => clearTimeout(timeout);
    }, [show]);

    return (
        <AnimatePresence>
            {particles.length > 0 && (
                <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{
                                x: `${p.x}vw`,
                                y: -20,
                                rotate: 0,
                                opacity: 1,
                            }}
                            animate={{
                                y: "110vh",
                                rotate: p.rotation + 720,
                                opacity: [1, 1, 0.8, 0],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 2.5 + Math.random(),
                                delay: p.delay,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            style={{
                                position: "absolute",
                                width: p.size,
                                height: p.size * 0.6,
                                backgroundColor: p.color,
                                borderRadius: "2px",
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfettiCelebration;
