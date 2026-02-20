import { getDashboardData } from '@/actions';
import { MonitoringTable } from '@/components/ui/MonitoringTable';
import { Activity } from 'lucide-react';
import AdminButton from '@/components/ui/AdminButton';
import GoogleSheetUrlPanel from '@/components/dashboard/GoogleSheetUrlPanel';


export const dynamic = 'force-dynamic';

export default async function Home() {
  let targets: Awaited<ReturnType<typeof getDashboardData>> = [];
  let errorMsg = null;

  try {
    targets = await getDashboardData();
  } catch (e: any) {
    console.error("Dashboard Error:", e);
    errorMsg = e.message || "Unknown error occurred";
    if (JSON.stringify(e).includes("binding")) {
      errorMsg += " (Potential DB Binding Issue)";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg text-white tracking-tight">
              EduMonitor
            </h1>
          </div>
          <AdminButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <GoogleSheetUrlPanel />
        </div>

        {errorMsg ? (
          <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 mb-6">
            <h2 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Alert
            </h2>
            <p className="text-xs font-mono opacity-80">{errorMsg}</p>
          </div>
        ) : null}

        <div className="space-y-6">
          {targets.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-slate-800 rounded-lg">
              <h3 className="text-lg font-medium text-slate-400">No Data Available</h3>
              <p className="text-sm text-slate-500 mt-2">Please import data to start monitoring.</p>
            </div>
          ) : (
            <MonitoringTable targets={targets} />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-12 bg-slate-900/30">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-bold text-slate-700 tracking-widest mb-4">PYHGOSHIFT</h3>
          <div className="text-xs text-slate-500 space-y-1">
            <p>EduMonitor System © 2026</p>
            <p>Contact: pyhgoshfit@gmail.com</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
