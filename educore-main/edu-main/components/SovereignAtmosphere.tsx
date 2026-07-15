import React from 'react';

/**
 * SovereignAtmosphere — Atmospheric depth layers for sovereign shells.
 * Renders: radial glow pulse, ambient particle field, vignette, and noise texture.
 * Place as the first child inside any sovereign void container.
 *
 * @param accentColor — CSS color for the radial glow (defaults to blue)
 * @param glowTop — position of glow center (defaults to '18%')
 * @param particleCount — number of ambient drift particles (defaults to 8)
 */

interface Props {
    accentColor?: string;
    glowTop?: string;
    particleCount?: number;
}

const SovereignAtmosphere: React.FC<Props> = ({
    accentColor = 'rgba(59,130,246,0.45)',
    glowTop = '18%',
    particleCount = 8,
}) => {
    // Generate particles with staggered timing across 3 drift variants
    const particles = Array.from({ length: particleCount }, (_, i) => {
        const animations = ['ambientDriftA', 'ambientDriftB', 'ambientDriftC'];
        const anim = animations[i % 3];
        const dur = 28 + Math.random() * 14; // 28-42s — extremely slow
        const delay = i * 4.5;               // stagger starts
        const left = 8 + Math.random() * 84; // 8%-92% horizontal spread
        const bottom = Math.random() * 30;   // start from lower 30%
        const size = 1.5 + Math.random() * 2.5; // 1.5-4px dots

        return (
            <div
                key={i}
                style={{
                    position: 'absolute',
                    left: `${left}%`,
                    bottom: `${bottom}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(148,163,184,0.5) 0%, rgba(100,116,139,0.15) 100%)`,
                    animation: `${anim} ${dur}s linear ${delay}s infinite`,
                    pointerEvents: 'none',
                    zIndex: 1,
                    willChange: 'transform, opacity',
                }}
            />
        );
    });

    return (
        <>
            {/* Layer 1 — Radial glow pulse behind logo/header */}
            <div
                style={{
                    position: 'absolute',
                    top: glowTop,
                    left: '50%',
                    width: 'clamp(280px, 45vw, 600px)',
                    height: 'clamp(280px, 45vw, 600px)',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${accentColor} 0%, rgba(99,102,241,0.18) 35%, rgba(14,20,48,0.06) 65%, transparent 100%)`,
                    filter: 'blur(60px)',
                    animation: 'sovereignGlowPulse 12s cubic-bezier(0.4,0,0.2,1) infinite',
                    pointerEvents: 'none',
                    zIndex: 1,
                    willChange: 'opacity, transform',
                }}
            />

            {/* Layer 2 — Ambient particle field */}
            {particles}

            {/* Layer 3 — Enhanced vignette */}
            <div className="vignette-depth" />

            {/* Layer 4 — Noise texture overlay */}
            <div className="noise-texture" />
        </>
    );
};

export default SovereignAtmosphere;
