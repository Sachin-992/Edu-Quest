import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Sparkles, Star, Trophy, Calculator, BookA, Languages, Atom, Flame, Users, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const avatars = [
    { id: 0, emoji: "👦🏽", color: "bg-blue-400", name: "Arya" },
    { id: 1, emoji: "👧🏻", color: "bg-purple-400", name: "You" },
    { id: 2, emoji: "👦🏿", color: "bg-emerald-400", name: "Kabir" }
];

const KidsScrollExperience = () => {
    const containerRef = useRef<HTMLElement>(null);
    const navigate = useNavigate();
    const [selectedHero, setSelectedHero] = useState<number>(1);

    useGSAP(() => {
        const mm = gsap.matchMedia();

        mm.add("(prefers-reduced-motion: no-preference)", () => {
            if (!containerRef.current) return;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "+=300%",
                    scrub: 1,
                    pin: true,
                    anticipatePin: 1,
                }
            });

            /* ==== SCENE 1: Introduction & Ownership ==== */
            tl.fromTo(".bg-sparkles", { opacity: 0 }, { opacity: 1, duration: 0.5 })
                .fromTo(".scene-1-text", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "<0.2")
                .fromTo(".social-proof-1", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "back.out(1.2)" }, "<0.2")
                .fromTo(".social-proof-2", { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "back.out(1.2)" }, "<0.1")
                .fromTo(".kids-group", { y: 150, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.2)" }, "-=0.2")
                .fromTo(".tap-hint", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, yoyo: true, repeat: -1 }, "+=0.2");

            /* ==== SCENE 2: Subject Discovery ==== */
            tl.to(".scene-1-text", { y: -30, opacity: 0, duration: 0.5 })
                .to([".social-proof-1", ".social-proof-2", ".tap-hint"], { opacity: 0, y: -20, duration: 0.5 }, "<")
                .fromTo(".subject-icons", { scale: 0, opacity: 0, rotation: -45 }, { scale: 1, opacity: 1, rotation: 0, duration: 1, stagger: 0.1, ease: "back.out(1.5)" })
                .to(".icon-math", { y: -40, x: -30, rotation: 15, duration: 2, yoyo: true, repeat: -1, ease: "sine.inOut" }, "<")
                .to(".icon-science", { y: 20, x: 40, rotation: -10, duration: 2.5, yoyo: true, repeat: -1, ease: "sine.inOut" }, "<")
                .to(".icon-tamil", { y: -30, x: 50, rotation: 10, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" }, "<")
                .to(".icon-english", { y: 40, x: -40, rotation: -15, duration: 2.7, yoyo: true, repeat: -1, ease: "sine.inOut" }, "<");

            /* ==== SCENE 3: Progression & Badges ==== */
            tl.to(".subject-icons", { scale: 0.8, opacity: 0.3, duration: 0.5 })
                .fromTo(".scene-3-text", { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5 })
                .fromTo(".xp-coins", { y: -100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "bounce.out" }, "<0.2")
                .fromTo(".badge-element", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, "<0.3")
                .fromTo(".progress-container", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.3")
                .fromTo(".progress-bar-fill", { width: "0%" }, { width: "85%", duration: 1.5, ease: "power3.out" }, "+=0.1");

            /* ==== SCENE 4: Celebration, CTA & Curiosity ==== */
            tl.to(".scene-3-text", { y: -20, opacity: 0, duration: 0.4 })
                .fromTo(".confetti", { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.05 })
                .to(".kids-group", { y: -15, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<")
                .fromTo(".final-cta", { scale: 0.8, opacity: 0, y: 50 }, { scale: 1, opacity: 1, y: 0, duration: 1, ease: "back.out(1.2)" }, "<0.2")
                .fromTo(".curiosity-loop", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5, yoyo: true, repeat: -1 }, "+=0.3");
        });
    }, { scope: containerRef });

    // Emotional Celebration Loop (Hover Effects)
    const handleCTAHover = () => {
        gsap.to(".cta-btn", { scale: 1.05, boxShadow: "0 0 30px rgba(99, 102, 241, 0.6)", duration: 0.3 });
        gsap.fromTo(".hover-confetti",
            { opacity: 1, y: 0, scale: 0.5 },
            { opacity: 0, y: -40, scale: 1.2, duration: 0.6, stagger: 0.05, ease: "power2.out" }
        );
    };

    const handleCTALeave = () => {
        gsap.to(".cta-btn", { scale: 1, boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.5)", duration: 0.3 });
        gsap.set(".hover-confetti", { opacity: 0 });
    };

    // Ownership Effect selection
    const selectHero = (index: number) => {
        setSelectedHero(index);
        gsap.fromTo(`.hero-avatar-${index}`,
            { scale: 0.9, rotation: -10 },
            { scale: 1.1, rotation: 0, ease: "elastic.out(1, 0.5)", duration: 0.6 }
        );
        gsap.fromTo(".hero-selected-particles",
            { scale: 0, opacity: 1 },
            { scale: 1.5, opacity: 0, duration: 0.4, ease: "power2.out" }
        );
    };

    return (
        <section ref={containerRef} id="kids-section" className="w-full min-h-screen relative overflow-hidden bg-gradient-to-b from-[#f8faff] to-[#eef2ff] flex items-center justify-center font-sans perspective-1000">
            {/* Background Sparkles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden bg-sparkles opacity-0">
                <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-3xl mix-blend-multiply" />
                <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl mix-blend-multiply" />
                <div className="absolute bottom-[10%] left-[40%] w-[600px] h-[600px] bg-pink-400/10 rounded-full blur-3xl mix-blend-multiply" />
            </div>

            <div className="relative w-full max-w-6xl mx-auto px-6 h-screen flex flex-col items-center justify-center z-10">

                <div className="absolute top-[12%] md:top-[12%] w-full text-center h-[100px] pointer-events-none">
                    <h2 className="scene-1-text absolute w-full flex flex-col items-center justify-center opacity-0 z-30">
                        <span className="text-4xl md:text-5xl font-black text-indigo-900 tracking-tight">
                            Learning is <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">better together!</span>
                        </span>
                        <span className="tap-hint mt-4 text-sm font-bold text-amber-500 bg-amber-50 px-4 py-1.5 rounded-full shadow-sm border border-amber-200 pointer-events-auto">
                            👆 Tap to Choose Your Hero!
                        </span>
                    </h2>
                    <h2 className="scene-3-text absolute w-full text-4xl md:text-5xl font-black text-indigo-900 tracking-tight opacity-0 z-30">
                        Earn XP. Unlock Badges.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Become a Champion!</span>
                    </h2>
                </div>

                {/* Social Proof Triggers */}
                <div className="social-proof-1 absolute top-[22%] left-[2%] md:left-[10%] bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-2 opacity-0 z-10 hidden sm:flex">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xs md:text-sm font-bold text-slate-700">12 students playing now</span>
                </div>
                <div className="social-proof-2 absolute top-[30%] right-[2%] md:right-[10%] bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-2 opacity-0 z-10 hidden sm:flex">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-xs md:text-sm font-bold text-slate-700"><span className="text-indigo-600">Arjun</span> reached Level 6!</span>
                </div>

                {/* Layer 2: Main Anchor point (Kids/Avatars/Progress) */}
                <div className="kids-group relative z-20 mt-[2vh] flex flex-col items-center">
                    <div className="relative w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-full bg-gradient-to-br from-indigo-100 to-purple-50 flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3)] border-8 border-white">
                        <div className="flex -space-x-4 md:-space-x-6 relative">
                            {avatars.map((av, idx) => {
                                const isSelected = selectedHero === idx;
                                return (
                                    <div
                                        key={av.id}
                                        onClick={() => selectHero(idx)}
                                        className={cn(
                                            `hero-avatar-${idx} relative rounded-full border-4 shadow-xl flex items-center justify-center cursor-pointer transition-all duration-300`,
                                            av.color,
                                            isSelected ? "w-28 h-28 md:w-36 md:h-36 border-amber-300 z-30 scale-110" : "w-16 h-16 md:w-28 md:h-28 border-white z-10 opacity-80 hover:opacity-100 hover:scale-105",
                                            idx === 0 && !isSelected && "transform -rotate-6",
                                            idx === 1 && !isSelected && "transform -translate-y-2",
                                            idx === 2 && !isSelected && "transform rotate-6"
                                        )}
                                    >
                                        <span className={isSelected ? "text-5xl" : "text-3xl"}>{av.emoji}</span>
                                        {isSelected && (
                                            <div className="absolute -bottom-5 bg-white px-4 py-1 rounded-full text-xs font-black shadow-md border-2 border-slate-100 text-indigo-700">
                                                {av.name}
                                            </div>
                                        )}
                                        {isSelected && <div className="hero-selected-particles absolute inset-0 bg-white rounded-full opacity-0 pointer-events-none" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Progress Motivation (Scene 3 details) */}
                    <div className="progress-container w-full max-w-[300px] md:max-w-sm mt-8 opacity-0 flex flex-col gap-2 relative z-30">
                        <div className="flex justify-between items-end px-2">
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
                                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                                <span className="text-xs font-bold text-slate-700">5 Days</span>
                            </div>
                            <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">Level 3</span>
                        </div>
                        <div className="h-4 bg-white rounded-full border-2 border-indigo-100 overflow-hidden shadow-inner relative">
                            <div className="progress-bar-fill h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full relative">
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)50%,rgba(255,255,255,0.2)75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]" />
                            </div>
                        </div>
                        <div className="flex justify-between px-2 text-[10px] md:text-[11px] font-bold text-slate-500">
                            <span>850 / 1000 XP</span>
                            <span className="text-emerald-600">2 quizzes to Level Up!</span>
                        </div>
                    </div>

                    {/* Floating Subject Icons */}
                    <div className="subject-icons icon-math absolute -top-4 -left-6 md:-top-16 md:-left-12 w-16 h-16 md:w-20 md:h-20 bg-blue-500 rounded-2xl shadow-xl flex items-center justify-center text-white rotate-12 opacity-0">
                        <Calculator className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="subject-icons icon-science absolute bottom-24 -right-10 md:bottom-20 md:-right-16 w-16 h-16 md:w-20 md:h-20 bg-emerald-500 rounded-full shadow-xl flex items-center justify-center text-white -rotate-12 opacity-0">
                        <Atom className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="subject-icons icon-tamil absolute top-10 -right-8 md:top-20 md:-right-20 w-16 h-16 md:w-24 md:h-24 bg-amber-500 rounded-3xl shadow-xl flex items-center justify-center text-white rotate-6 opacity-0">
                        <Languages className="w-8 h-8 md:w-12 md:h-12" />
                        <span className="absolute -bottom-2 -right-2 text-xs font-bold bg-white text-rose-600 px-2 rounded-full shadow-sm">அ</span>
                    </div>
                    <div className="subject-icons icon-english absolute bottom-28 -left-12 md:-left-20 w-16 h-16 md:w-20 md:h-20 bg-rose-500 rounded-[2rem] shadow-xl flex items-center justify-center text-white -rotate-6 opacity-0">
                        <BookA className="w-8 h-8 md:w-10 md:h-10" />
                    </div>

                    {/* XP Coins & Badges */}
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-40">
                        <div className="xp-coins absolute top-[25%] left-[5%] md:left-[-10%] w-12 h-12 bg-yellow-400 rounded-full border-4 border-yellow-200 shadow-lg flex items-center justify-center text-yellow-800 font-bold opacity-0">XP</div>
                        <div className="xp-coins absolute top-[20%] right-[10%] md:right-[-5%] w-10 h-10 bg-yellow-400 rounded-full border-4 border-yellow-200 shadow-lg flex items-center justify-center text-yellow-800 font-bold opacity-0 text-xs">XP</div>

                        <div className="badge-element absolute top-10 left-1/2 -translate-x-1/2 bg-white px-6 py-2 md:py-3 rounded-full border-2 border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] flex items-center gap-2 opacity-0 z-50">
                            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                            <span className="text-sm md:text-base font-bold text-slate-800">Class Rank #1</span>
                        </div>
                    </div>
                </div>

                {/* Layer 5: Final CTA */}
                <div className="final-cta absolute bottom-[3%] md:bottom-[8%] opacity-0 z-50 flex flex-col items-center">
                    {/* Competence Feeling Trigger */}
                    <div className="mb-3 bg-indigo-100 text-indigo-800 text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full border border-indigo-200 shadow-sm flex items-center gap-1.5 transform hover:scale-105 transition-transform cursor-default">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Recommended: Easy Start Mode
                    </div>

                    <button
                        onMouseEnter={handleCTAHover}
                        onMouseLeave={handleCTALeave}
                        onClick={() => navigate("/login")}
                        className="cta-btn group relative px-8 py-4 md:px-10 md:py-5 bg-indigo-600 rounded-2xl font-bold text-lg md:text-xl text-white overflow-hidden shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] z-20 outline-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500 rounded-2xl" />
                        <span className="relative flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-300 pointer-events-none group-active:scale-90 transition-transform" />
                            Start Your Adventure
                            <Sparkles className="w-5 h-5 text-yellow-300 pointer-events-none group-active:scale-90 transition-transform" />
                        </span>

                        {/* Hover Micro-reward Confetti */}
                        {[...Array(6)].map((_, i) => (
                            <div key={`hc-${i}`} className={`hover-confetti absolute w-2 h-2 rounded-full opacity-0 pointer-events-none ${['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-emerald-400'][i % 4]}`}
                                style={{ left: `${20 + i * 13}%`, top: '50%' }} />
                        ))}
                    </button>

                    {/* Micro Reward Anticipation */}
                    <div className="mt-3 text-[10px] md:text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        Today's Reward: <span className="text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded shadow-sm border border-amber-100">🏆 50 XP + Surprise Badge</span>
                    </div>

                    {/* Curiosity Loop */}
                    <div className="curiosity-loop mt-4 md:mt-6 flex flex-col items-center opacity-0 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                        <span className="text-[10px] md:text-xs font-bold mb-1 uppercase tracking-wider">Scroll to Unlock Secret Pet</span>
                        <ChevronDown className="w-4 h-4 animate-bounce text-indigo-400" />
                    </div>
                </div>

                {/* Scene 4 Ambient Confetti */}
                {[...Array(15)].map((_, i) => (
                    <div
                        key={`bg-conf-${i}`}
                        className="confetti absolute w-2 h-2 md:w-3 md:h-3 rounded-sm opacity-0 z-10"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
                            transform: `rotate(${Math.random() * 360}deg)`
                        }}
                    />
                ))}

            </div>
        </section>
    );
};

export default KidsScrollExperience;
