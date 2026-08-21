"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type StoreSettings = {
  id?: string;

  store_name: string;
  tagline: string;

  email: string;
  phone: string;
  whatsapp: string;

  address: string;
  city: string;
  state: string;
  pin_code: string;

  shipping_info: string;
  payment_info: string;

  invoice_business_name: string;
  invoice_email: string;
  invoice_phone: string;
  invoice_address: string;
  invoice_gstin: string;
};

const defaultSettings: StoreSettings = {
  store_name: "MAKHAN",
  tagline: "Pure. Rich. Traditional.",

  email: "",
  phone: "",
  whatsapp: "",

  address: "",
  city: "",
  state: "",
  pin_code: "",

  shipping_info: "",
  payment_info: "Online Payment",

  invoice_business_name: "",
  invoice_email: "",
  invoice_phone: "",
  invoice_address: "",
  invoice_gstin: "",
};

export default function StoreSettingsPage() {
  const [settings, setSettings] =
    useState<StoreSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      setMessageType("error");
      setMessage(`Settings load failed: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data) {
      setSettings({
        id: data.id,

        store_name: data.store_name ?? "",
        tagline: data.tagline ?? "",

        email: data.email ?? "",
        phone: data.phone ?? "",
        whatsapp: data.whatsapp ?? "",

        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        pin_code: data.pin_code ?? "",

        shipping_info: data.shipping_info ?? "",
        payment_info: data.payment_info ?? "Online Payment",

        invoice_business_name:
          data.invoice_business_name ?? "",
        invoice_email: data.invoice_email ?? "",
        invoice_phone: data.invoice_phone ?? "",
        invoice_address:
          data.invoice_address ?? "",
        invoice_gstin: data.invoice_gstin ?? "",
      });
    }

    setLoading(false);
  }

  function updateField(
    field: keyof StoreSettings,
    value: string
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateSettings() {
    if (!settings.store_name.trim()) {
      return "Please enter your store name.";
    }

    if (
      settings.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        settings.email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (
      settings.pin_code.trim() &&
      !/^\d{6}$/.test(
        settings.pin_code.trim()
      )
    ) {
      return "PIN Code must contain exactly 6 digits.";
    }

    if (
      settings.phone.trim() &&
      !/^[6-9]\d{9}$/.test(
        settings.phone.replace(/\s+/g, "")
      )
    ) {
      return "Please enter a valid 10-digit Indian mobile number.";
    }

    if (
      settings.whatsapp.trim() &&
      !/^[6-9]\d{9}$/.test(
        settings.whatsapp.replace(/\s+/g, "")
      )
    ) {
      return "Please enter a valid WhatsApp number.";
    }

    if (
      settings.invoice_email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        settings.invoice_email.trim()
      )
    ) {
      return "Please enter a valid invoice email address.";
    }

    return null;
  }

  async function saveSettings() {
    const validationError = validateSettings();

    if (validationError) {
      setMessageType("error");
      setMessage(validationError);
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      store_name: settings.store_name.trim(),
      tagline: settings.tagline.trim(),

      email: settings.email.trim(),
      phone: settings.phone.replace(/\s+/g, ""),
      whatsapp: settings.whatsapp.replace(/\s+/g, ""),

      address: settings.address.trim(),
      city: settings.city.trim(),
      state: settings.state.trim(),
      pin_code: settings.pin_code.trim(),

      shipping_info: settings.shipping_info.trim(),

      // Online payment only
      payment_info: "Online Payment",

      invoice_business_name:
        settings.invoice_business_name.trim(),
      invoice_email:
        settings.invoice_email.trim(),
      invoice_phone:
        settings.invoice_phone.replace(/\s+/g, ""),
      invoice_address:
        settings.invoice_address.trim(),
      invoice_gstin:
        settings.invoice_gstin.trim(),
    };

    let error;

    if (settings.id) {
      const result = await supabase
        .from("store_settings")
        .update(payload)
        .eq("id", settings.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("store_settings")
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
      setMessageType("error");
      setMessage(`Save failed: ${error.message}`);
      setSaving(false);
      return;
    }

    setSettings((current) => ({
      ...current,
      ...payload,
    }));

    setMessageType("success");
    setMessage("✓ Store settings saved successfully.");
    setSaving(false);
  }

  function goToDashboard() {
    window.location.href = "/admin/dashboard";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0d0c] text-white">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#d8bd73]">
            MAKHAN
          </p>

          <p className="mt-4 text-sm text-white/40">
            Loading store settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0c] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#d8bd73]">
              Admin Panel
            </p>

            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Store Settings
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Manage your store information, contact details,
              delivery information and invoice details.
            </p>
          </div>

          <button
            type="button"
            onClick={goToDashboard}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
          >
            ← Dashboard
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mt-6 rounded-2xl border px-5 py-4 text-sm ${
              messageType === "success"
                ? "border-[#d8bd73]/20 bg-[#d8bd73]/10 text-[#e8d69d]"
                : "border-red-400/20 bg-red-400/10 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-8 space-y-8">

          {/* STORE INFORMATION */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
              General
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              Store Information
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Basic information displayed across your website.
            </p>

            <div className="mt-7 grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Store Name *
                </label>

                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) =>
                    updateField(
                      "store_name",
                      e.target.value
                    )
                  }
                  placeholder="MAKHAN"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none transition focus:border-[#d8bd73]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Tagline
                </label>

                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) =>
                    updateField(
                      "tagline",
                      e.target.value
                    )
                  }
                  placeholder="Pure. Rich. Traditional."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none transition focus:border-[#d8bd73]/50"
                />
              </div>

            </div>
          </section>

          {/* CONTACT */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
              Contact
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              Customer Contact
            </h2>

            <p className="mt-2 text-sm text-white/40">
              These details can be used by customers to contact
              your business.
            </p>

            <div className="mt-7 grid gap-6 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Email
                </label>

                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    updateField(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="support@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Phone
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={settings.phone}
                  onChange={(e) =>
                    updateField(
                      "phone",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  WhatsApp
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={settings.whatsapp}
                  onChange={(e) =>
                    updateField(
                      "whatsapp",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

            </div>
          </section>

          {/* ADDRESS */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
              Delivery
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              Store Address
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Your business or delivery address.
            </p>

            <div className="mt-7">

              <label className="mb-2 block text-sm text-white/60">
                Address
              </label>

              <textarea
                value={settings.address}
                onChange={(e) =>
                  updateField(
                    "address",
                    e.target.value
                  )
                }
                rows={3}
                placeholder="House/Shop number, Street, Area..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
              />

            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  City
                </label>

                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) =>
                    updateField(
                      "city",
                      e.target.value
                    )
                  }
                  placeholder="City"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  State
                </label>

                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) =>
                    updateField(
                      "state",
                      e.target.value
                    )
                  }
                  placeholder="State"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  PIN Code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={settings.pin_code}
                  onChange={(e) =>
                    updateField(
                      "pin_code",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="847211"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

            </div>
          </section>

          {/* SHIPPING & PAYMENT */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
              Checkout
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              Shipping & Payment
            </h2>

            <div className="mt-7">

              <label className="mb-2 block text-sm text-white/60">
                Shipping Information
              </label>

              <textarea
                value={settings.shipping_info}
                onChange={(e) =>
                  updateField(
                    "shipping_info",
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Example: Delivery available across India. Orders are carefully packed and shipped..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
              />

            </div>

            <div className="mt-6 rounded-2xl border border-[#d8bd73]/20 bg-[#d8bd73]/10 p-5">

              <p className="text-xs uppercase tracking-[0.2em] text-[#d8bd73]">
                Payment Method
              </p>

              <div className="mt-3 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8bd73] text-black">
                  ₹
                </div>

                <div>
                  <p className="font-medium">
                    Online Payment
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Customers pay online during checkout.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* INVOICE */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
              Billing
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              Invoice Details
            </h2>

            <p className="mt-2 text-sm text-white/40">
              These details can be used when generating customer
              invoices.
            </p>

            <div className="mt-7 grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Business Name
                </label>

                <input
                  type="text"
                  value={settings.invoice_business_name}
                  onChange={(e) =>
                    updateField(
                      "invoice_business_name",
                      e.target.value
                    )
                  }
                  placeholder="MAKHAN"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Invoice Email
                </label>

                <input
                  type="email"
                  value={settings.invoice_email}
                  onChange={(e) =>
                    updateField(
                      "invoice_email",
                      e.target.value
                    )
                  }
                  placeholder="billing@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Invoice Phone
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={settings.invoice_phone}
                  onChange={(e) =>
                    updateField(
                      "invoice_phone",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  GSTIN
                </label>

                <input
                  type="text"
                  maxLength={15}
                  value={settings.invoice_gstin}
                  onChange={(e) =>
                    updateField(
                      "invoice_gstin",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 uppercase outline-none focus:border-[#d8bd73]/50"
                />
              </div>

            </div>

            <div className="mt-6">

              <label className="mb-2 block text-sm text-white/60">
                Invoice Address
              </label>

              <textarea
                value={settings.invoice_address}
                onChange={(e) =>
                  updateField(
                    "invoice_address",
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Business address shown on invoices..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
              />

            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">

              <p className="text-sm font-medium">
                Invoice system
              </p>

              <p className="mt-2 text-xs leading-5 text-white/40">
                Once orders are connected to the admin panel,
                these business details can be used to generate
                printable customer invoices.
              </p>

            </div>
          </section>

          {/* SAVE */}
          <section className="sticky bottom-4 z-10">

            <div className="rounded-2xl border border-white/10 bg-[#111110]/95 p-4 shadow-2xl backdrop-blur">

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="w-full rounded-full bg-gradient-to-r from-[#c7a95c] to-[#f0d98f] px-8 py-4 text-sm font-semibold text-[#17150f] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving Settings..."
                  : "Save Store Settings"}
              </button>

            </div>

          </section>

        </div>
      </div>
    </main>
  );
}