const WAVE_ACCENT = "oklch(0.52 0.13 250)";

export function AuthWaveBackground() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-background">
            <div
                className="absolute top-0 left-0 h-[70%] w-[55%] opacity-[0.07] dark:opacity-[0.14]"
                style={{
                    background: WAVE_ACCENT,
                    clipPath: "polygon(0 0, 62% 0, 0 100%)",
                }}
            />
            <div
                className="absolute top-0 right-0 h-[85%] w-[42%] opacity-[0.06] dark:opacity-[0.12]"
                style={{
                    background: WAVE_ACCENT,
                    clipPath: "polygon(100% 0, 100% 100%, 28% 0)",
                }}
            />
            <div
                className="absolute top-0 right-[8%] h-[45%] w-[20%] opacity-[0.05] dark:opacity-[0.1]"
                style={{
                    background: WAVE_ACCENT,
                    clipPath: "polygon(100% 0, 100% 60%, 0 0)",
                }}
            />

            <svg
                className="absolute inset-x-0 bottom-0 h-[46%] w-full min-w-[1400px] motion-safe:animate-[wave-drift_36s_linear_infinite]"
                viewBox="0 0 1920 620"
                preserveAspectRatio="none"
                fill="none"
            >
                <path
                    d="M0 420 C 220 330, 420 500, 660 400 S 1120 300, 1360 420 S 1760 340, 1920 400 V620 H0 Z"
                    fill={WAVE_ACCENT}
                    opacity="0.06"
                />
                <path
                    d="M0 470 C 260 390, 480 540, 740 450 S 1180 360, 1420 460 S 1780 380, 1920 440"
                    stroke={WAVE_ACCENT}
                    strokeWidth="2"
                    opacity="0.4"
                />
                <path
                    d="M0 510 C 300 430, 520 580, 800 490 S 1240 400, 1480 500 S 1820 420, 1920 480"
                    stroke={WAVE_ACCENT}
                    strokeWidth="2"
                    opacity="0.28"
                />
                <path
                    d="M0 550 C 340 470, 560 610, 860 530 S 1300 440, 1540 540 S 1860 460, 1920 520"
                    stroke={WAVE_ACCENT}
                    strokeWidth="2"
                    opacity="0.18"
                />
            </svg>
        </div>
    );
}
