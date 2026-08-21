"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SocialSettings = {
  id?: string;
  instagram: string;
  facebook: string;
  youtube: string;
};

const defaultSettings: SocialSettings = {
  instagram: "",
  facebook: "",
  youtube: "",
};

export default function SocialMediaPage() {
  const [settings, setSettings] =
    useState<SocialSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSocialSettings();
  }, []);

  async function loadSocialSettings() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("store_social")
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
        instagram: data.instagram ?? "",
        facebook: data.facebook ?? "",
        youtube: data.youtube ?? "",
      });
    }

    setLoading(false);
  }

  function updateField(
    field: keyof SocialSettings,
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
      instagram: settings.instagram.trim(),
      facebook: settings.facebook.trim(),
      youtube: settings.youtube.trim(),
      updated_at: new Date().toISOString(),
    };

    if (settings.id) {
      const { error } = await supabase
        .from("store_social")
        .update(payload)
        .eq("id", settings.id);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("store_social")
        .insert(payload)
        .select()
        .single();

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      if (data) {
        setSettings((current) => ({
          ...current,
          id: data.id,
        }));
      }
    }

    setMessage("Social media links saved successfully.");
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
              Social Media
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Manage the social media links displayed on your website.
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
            Loading social media settings...
          </div>
        ) : (
          <div className="mt-8 space-y-6">

            {/* Instagram */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  📸
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                    Instagram
                  </p>

                  <h2 className="mt-1 text-xl font-medium">
                    Instagram Profile
                  </h2>
                </div>
              </div>

              <input
                type="url"
                value={settings.instagram}
                onChange={(e) =>
                  updateField("instagram", e.target.value)
                }
                placeholder="https://instagram.com/yourpage"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm outline-none placeholder:text-white/20 focus:border-[#d8bd73]/50"
              />
            </div>

            {/* Facebook */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  f
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                    Facebook
                  </p>

                  <h2 className="mt-1 text-xl font-medium">
                    Facebook Page
                  </h2>
                </div>
              </div>

              <input
                type="url"
                value={settings.facebook}
                onChange={(e) =>
                  updateField("facebook", e.target.value)
                }
                placeholder="https://facebook.com/yourpage"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm outline-none placeholder:text-white/20 focus:border-[#d8bd73]/50"
              />
            </div>

            {/* YouTube */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  ▶
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                    YouTube
                  </p>

                  <h2 className="mt-1 text-xl font-medium">
                    YouTube Channel
                  </h2>
                </div>
              </div>

              <input
                type="url"
                value={settings.youtube}
                onChange={(e) =>
                  updateField("youtube", e.target.value)
                }
                placeholder="https://youtube.com/@yourchannel"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm outline-none placeholder:text-white/20 focus:border-[#d8bd73]/50"
              />
            </div>

            {/* Save */}
            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full rounded-full bg-[#d8bd73] px-8 py-4 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Social Media Links"}
            </button>

          </div>
        )}
      </div>
    </main>
  );
}