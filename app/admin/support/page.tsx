"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SupportSettings = {
  id?: string;
  phone: string;
  whatsapp: string;
  email: string;
  message: string;
};

const defaultSettings: SupportSettings = {
  phone: "",
  whatsapp: "",
  email: "",
  message: "",
};

export default function SupportPage() {
  const [settings, setSettings] =
    useState<SupportSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("store_support")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setSettings({
        id: data.id,
        phone: data.phone ?? "",
        whatsapp: data.whatsapp ?? "",
        email: data.email ?? "",
        message: data.message ?? "",
      });
    }

    setLoading(false);
  }

  function updateField(
    field: keyof SupportSettings,
    value: string
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    const payload = {
      phone: settings.phone.trim(),
      whatsapp: settings.whatsapp.trim(),
      email: settings.email.trim(),
      message: settings.message.trim(),
    };

    let error;

    if (settings.id) {
      const result = await supabase
        .from("store_support")
        .update(payload)
        .eq("id", settings.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("store_support")
        .insert(payload)
        .select()
        .single();

      error = result.error;

      if (result.data) {
        setSettings((current) => ({
          ...current,
          id: result.data.id,
        }));
      }
    }

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Customer support settings saved successfully.");
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[#0d0d0c] px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#d8bd73]">
              Admin Panel
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Customer Support
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Manage the contact information shown to your customers.
            </p>
          </div>

          <button
            onClick={() =>
              (window.location.href = "/admin/dashboard")
            }
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
          >
            ← Dashboard
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mt-6 rounded-xl border border-[#d8bd73]/20 bg-[#d8bd73]/10 px-5 py-4 text-sm text-[#e8d69d]">
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-sm text-white/40">
            Loading support settings...
          </div>
        ) : (
          <div className="mt-8 space-y-6">

            {/* Phone */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                Phone
              </p>

              <h2 className="mt-2 text-xl font-medium">
                Customer Support Phone
              </h2>

              <input
                type="tel"
                value={settings.phone}
                onChange={(e) =>
                  updateField("phone", e.target.value)
                }
                placeholder="Enter support phone number"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm outline-none placeholder:text-white/20 focus:border-[#d8bd73]/50"
              />
            </div>

            {/* WhatsApp */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                WhatsApp
              </p>

              <h2 className="mt-2 text-xl font-medium">
                WhatsApp Support Number
              </h2>

              <input
                type="tel"
                value={settings.whatsapp}
                onChange={(e) =>
                  updateField("whatsapp", e.target.value)
                }
                placeholder="Enter WhatsApp number"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm outline-none placeholder:text-white/20 focus:border-[#d8bd73]/50"
              />
            </div>

            {/* Email */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                Email
              </p>

              <h2 className="mt-2 text-xl font-medium">
                Customer Support Email
              </h2>

              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  updateField("email", e.target.value)
                }
                placeholder="support@example.com"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm outline-none placeholder:text-white/20 focus:border-[#d8bd73]/50"
              />
            </div>

            {/* Message */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                Support Message
              </p>

              <h2 className="mt-2 text-xl font-medium">
                Customer Support Message
              </h2>

              <textarea
                value={settings.message}
                onChange={(e) =>
                  updateField("message", e.target.value)
                }
                placeholder="How can we help you?"
                rows={5}
                className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm outline-none placeholder:text-white/20 focus:border-[#d8bd73]/50"
              />
            </div>

            {/* Save */}
            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full rounded-full bg-[#d8bd73] px-8 py-4 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Support Settings"}
            </button>

          </div>
        )}
      </div>
    </main>
  );
}