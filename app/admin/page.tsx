"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    window.location.href = "/admin/dashboard";
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0d0c] px-6">
      {/* Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5d78e]/20 blur-[140px]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff4cf]/10 blur-[80px]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        
        {/* Brand */}
        <div className="mb-9 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#d8bd73]">
            Private Area
          </p>

          <h1 className="mt-4 bg-gradient-to-r from-[#fff3c4] via-[#e5c77b] to-[#fff3c4] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
            MAKHAN
          </h1>

          <p className="mt-2 text-sm font-medium tracking-wide text-white/60">
            Admin Panel
          </p>

          <p className="mt-4 text-xs leading-5 text-white/40">
            Manage your products, prices, orders and store settings.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#d8bd73]/60 focus:ring-2 focus:ring-[#d8bd73]/10"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#d8bd73]/60 focus:ring-2 focus:ring-[#d8bd73]/10"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#c7a95c] via-[#f0d98f] to-[#c7a95c] px-6 py-3.5 text-sm font-semibold text-[#17150f] shadow-lg shadow-[#c7a95c]/10 transition duration-300 hover:scale-[1.01] hover:shadow-[#c7a95c]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Bottom */}
        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-[11px] tracking-wide text-white/30">
            Secure administration • MAKHAN
          </p>
        </div>
      </div>
    </main>
  );
}