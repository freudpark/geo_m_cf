export default function Loader() {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-neon-green/30 animate-ping"></div>
                <div className="absolute inset-2 rounded-full bg-neon-green animate-pulse shadow-[0_0_15px_#39FF14]"></div>
            </div>
            <p className="text-neon-green text-sm font-mono animate-pulse">Initializing Sentinel...</p>
        </div>
    );
}
