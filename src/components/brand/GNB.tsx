import Link from 'next/link';

export default function GNB() {
    return (
        <nav className="w-full h-16 border-b border-white/10 flex items-center justify-between px-6 bg-deep-navy/50 backdrop-blur-md fixed top-0 left-0 z-50">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon-green to-emerald-500 animate-pulse group-hover:scale-110 transition-transform duration-300" />
                <span className="font-bold text-lg tracking-tight text-white">
                    PyhgoShift <span className="text-neon-green font-light">AgentOps Platform</span>
                </span>
            </Link>
            <div className="flex items-center gap-4">
                {/* Future user profile or settings */}
            </div>
        </nav>
    );
}
