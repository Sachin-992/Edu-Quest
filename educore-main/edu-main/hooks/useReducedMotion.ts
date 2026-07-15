import { useEffect, useState } from "react";

/**
 * Returns true if the user prefers reduced motion.
 * Use this to gate heavy framer-motion animations.
 *
 * @example
 * const reduced = useReducedMotion();
 * <motion.div animate={reduced ? {} : { scale: [1, 1.1, 1] }} />
 */
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return reduced;
}
