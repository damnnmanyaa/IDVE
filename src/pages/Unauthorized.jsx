import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="idve-app min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-2xl text-center space-y-6">
        
        <div className="h-12 w-12 rounded-full bg-rose-950/50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">403 Unauthorized Access</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            You do not have the required role permissions to access this page or resource.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-cyan-800 text-white font-semibold py-2.5 px-5 rounded-lg text-xs hover:bg-cyan-900 active:bg-zinc-200 transition shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

      </div>
    </div>
  );
}
