import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111113] p-8 rounded-xl border border-[#27272A] shadow-2xl text-center space-y-6">
        
        <div className="h-12 w-12 rounded-full bg-rose-950/50 border border-rose-800/50 text-[#EF4444] flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">403 Unauthorized Access</h1>
          <p className="text-xs text-[#A1A1AA] mt-2 leading-relaxed">
            You do not have the required role permissions to access this page or resource.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-[#F4F4F5] text-[#09090B] font-semibold py-2.5 px-5 rounded-lg text-xs hover:bg-white active:bg-zinc-200 transition shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

      </div>
    </div>
  );
}
