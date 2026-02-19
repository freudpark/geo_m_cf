export default function Footer() {
    return (
        <footer className="w-full py-6 border-t border-white/10 text-center text-sm text-white/40 mt-auto">
            <p>
                Operated by <span className="text-neon-green font-semibold">The 7 Parks AI Squad</span>
            </p>
            <div className="mt-2 text-xs opacity-50">
                &copy; {new Date().getFullYear()} PyhgoShift. All rights reserved.
            </div>
        </footer>
    );
}
