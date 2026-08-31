"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/admin");
        return;
      }

      setEmail(session.user.email || "");
      setLoading(false);
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0d0c] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#d8bd73]" />

          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-[#d8bd73]">
            Checking Access
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0c] text-white">
      <div className="flex min-h-screen">

        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#111110] p-6 lg:block">

          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#d8bd73]">
              Administration
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              MAKHAN
            </h1>

            <p className="mt-1 text-xs text-white/30">
              Store Management
            </p>
          </div>

          <nav className="mt-12 space-y-2">

            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
            >
              Products
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/orders")}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
            >
              Orders
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/support")}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
            >
              Customer Support
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/social")}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
            >
              Social Media
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/settings")}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
            >
              Store Settings
            </button>

          </nav>

          <button
            type="button"
            onClick={logout}
            className="mt-12 w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-white/50 hover:border-red-400/30 hover:text-red-300"
          >
            Sign Out
          </button>

        </aside>

        <section className="flex-1">

          <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 lg:px-10">

            <div>
              <p className="text-xs text-white/30">
                Welcome back
              </p>

              <h2 className="mt-1 text-xl font-medium">
                Store Dashboard
              </h2>
            </div>

            <div className="text-right">
              <p className="text-xs text-white/30">
                Admin
              </p>

              <p className="mt-1 max-w-[220px] truncate text-sm text-white/70">
                {email}
              </p>
            </div>

          </header>

          <div className="px-6 py-8 lg:px-10">

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <button
                type="button"
                onClick={() => router.push("/admin/products")}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left hover:border-[#d8bd73]/30"
              >
                <p className="text-xs text-white/40">
                  Products
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  1
                </p>

                <p className="mt-2 text-xs text-[#d8bd73]">
                  Manage Products →
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/orders")}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left hover:border-[#d8bd73]/30"
              >
                <p className="text-xs text-white/40">
                  Orders
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  0
                </p>

                <p className="mt-2 text-xs text-white/30">
                  Manage Orders →
                </p>
              </button>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs text-white/40">
                  Revenue
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  ₹0
                </p>

                <p className="mt-2 text-xs text-white/30">
                  Total sales
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/admin/products")}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left hover:border-[#d8bd73]/30"
              >
                <p className="text-xs text-white/40">
                  Stock
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  →
                </p>

                <p className="mt-2 text-xs text-[#d8bd73]">
                  View Products
                </p>
              </button>

            </div>

            <div className="mt-10">

              <p className="text-xs uppercase tracking-[0.3em] text-[#d8bd73]">
                Management
              </p>

              <h3 className="mt-3 text-2xl font-medium">
                Manage your store
              </h3>

              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                <button
                  type="button"
                  onClick={() => router.push("/admin/products")}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left hover:border-[#d8bd73]/30"
                >
                  <p className="text-2xl">🧈</p>

                  <h4 className="mt-5 text-lg font-medium">
                    Products
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Manage Makhan details, photos, pack sizes,
                    prices and stock.
                  </p>

                  <p className="mt-5 text-xs text-[#d8bd73]">
                    Manage Products →
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/orders")}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left hover:border-[#d8bd73]/30"
                >
                  <p className="text-2xl">📦</p>

                  <h4 className="mt-5 text-lg font-medium">
                    Orders
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    View customer orders, payment status and
                    delivery information.
                  </p>

                  <p className="mt-5 text-xs text-[#d8bd73]">
                    Manage Orders →
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/support")}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left hover:border-[#d8bd73]/30"
                >
                  <p className="text-2xl">💬</p>

                  <h4 className="mt-5 text-lg font-medium">
                    Customer Support
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Manage phone, WhatsApp, email and customer
                    support information.
                  </p>

                  <p className="mt-5 text-xs text-[#d8bd73]">
                    Manage Support →
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/social")}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left hover:border-[#d8bd73]/30"
                >
                  <p className="text-2xl">📱</p>

                  <h4 className="mt-5 text-lg font-medium">
                    Social Media
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Add and update Instagram, Facebook and
                    YouTube links.
                  </p>

                  <p className="mt-5 text-xs text-[#d8bd73]">
                    Manage Social Links →
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/settings")}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left hover:border-[#d8bd73]/30"
                >
                  <p className="text-2xl">⚙️</p>

                  <h4 className="mt-5 text-lg font-medium">
                    Store Settings
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Manage general store information and
                    website settings.
                  </p>

                  <p className="mt-5 text-xs text-[#d8bd73]">
                    Open Settings →
                  </p>
                </button>

              </div>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}