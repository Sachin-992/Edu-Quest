/**
 * SovereignCard — Universal dashboard card component
 *
 * Use this to wrap any dashboard widget/panel.
 * Enforces the Sovereign aesthetic: heavy glass shield,
 * luminance edge-lighting, controlled hover lift, and
 * institutional typography.
 *
 * Props:
 *   title         — uppercase tracked label displayed as card header
 *   icon          — optional lucide-react icon node
 *   accentRgb     — RGB triplet for border/glow (e.g. "99,102,241")
 *   accentColor   — hex/rgba string for the icon and header
 *   children      — card body content
 *   className     — optional extra class
 *   noPadding     — skip the default body padding (for tables/charts that bleed to edge)
 *   animate       — apply staggered cardEntrance animation
 *   animDelay     — animation delay in seconds (for staggering)
 *   action        — optional React node rendered top-right of header
 */

import React, { useState } from 'react';

interface SovereignCardProps {
    title?: string;
    icon?: React.ReactNode;
    accentRgb?: string;
    accentColor?: string;
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    animate?: boolean;
    animDelay?: number;
    action?: React.ReactNode;
    style?: React.CSSProperties;
}

export const SovereignCard: React.FC<SovereignCardProps> = ({
    title,
    icon,
    accentRgb = '99,102,241',
    accentColor = '#818cf8',
    children,
    className,
    noPadding = false,
    animate = true,
    animDelay = 0,
    action,
    style,
}) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={className}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                background: 'linear-gradient(145deg, rgba(10,15,32,0.65) 0%, rgba(7,10,22,0.7) 100%)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                /* Luminance top-edge lighting */
                border: `1px solid rgba(${accentRgb},${hovered ? '0.18' : '0.07'})`,
                borderTop: `1px solid rgba(${accentRgb},${hovered ? '0.38' : '0.16'})`,
                borderRadius: '16px',
                overflow: 'hidden',
                /* Layered Z2→Z3 shadow depth on hover */
                boxShadow: hovered ? [
                    '0 1px 2px rgba(0,0,0,0.22)',
                    '0 8px 20px rgba(0,0,0,0.45)',
                    `0 0 0 1px rgba(${accentRgb},0.1)`,
                    `0 24px 48px rgba(${accentRgb},0.08)`,
                    'inset 0 1px 0 rgba(255,255,255,0.05)',
                ].join(', ') : [
                    '0 1px 2px rgba(0,0,0,0.22)',
                    '0 4px 12px rgba(0,0,0,0.35)',
                    'inset 0 1px 0 rgba(255,255,255,0.04)',
                ].join(', '),
                /* Controlled lift: base 320ms ease-spring */
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: [
                    'transform 320ms cubic-bezier(0.16,1,0.3,1)',
                    'box-shadow 320ms cubic-bezier(0.25,0.46,0.45,0.94)',
                    'border-color 250ms cubic-bezier(0.4,0,0.2,1)',
                ].join(', '),
                /* Staggered entrance */
                animation: animate ? `cardEntrance 0.5s cubic-bezier(0.22,1,0.36,1) ${animDelay}s both` : undefined,
                ...style,
            }}
        >
            {/* Radial top-glow on hover */}
            <div style={{
                position: 'absolute', left: 0, right: 0, top: 0, height: '60%',
                background: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(${accentRgb},${hovered ? '0.1' : '0.03'}) 0%, transparent 70%)`,
                pointerEvents: 'none',
                transition: 'background 320ms cubic-bezier(0.25,0.46,0.45,0.94)',
            }} />

            {/* Card Header */}
            {(title || action) && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1.125rem 0',
                    marginBottom: noPadding ? '0' : '0.125rem',
                }}>
                    {title && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                            {icon && (
                                <div style={{
                                    color: accentColor,
                                    display: 'flex', alignItems: 'center',
                                    opacity: hovered ? 1 : 0.75,
                                    transition: 'opacity 250ms ease',
                                }}>{icon}</div>
                            )}
                            <span style={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: '0.62rem', fontWeight: 700,
                                color: hovered ? 'rgba(148,163,184,0.65)' : 'rgba(100,116,139,0.45)',
                                letterSpacing: '0.15em', textTransform: 'uppercase',
                                transition: 'color 250ms cubic-bezier(0.4,0,0.2,1)',
                            }}>{title}</span>
                        </div>
                    )}
                    {action && (
                        <div style={{ marginLeft: 'auto' }}>{action}</div>
                    )}
                </div>
            )}

            {/* Separator line */}
            {title && (
                <div style={{
                    height: '1px', margin: '0.625rem 1.125rem',
                    background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.12), transparent)`,
                    transition: 'background 250ms ease',
                }} />
            )}

            {/* Card Body */}
            <div style={{ padding: noPadding ? 0 : '0 1.125rem 1.125rem' }}>
                {children}
            </div>
        </div>
    );
};

export default SovereignCard;
