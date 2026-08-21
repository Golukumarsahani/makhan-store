"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  order_status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  size: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

const steps = [
  "pending",
  "confirmed",
  "processing",
  "pickup",
  "shipped",
  "out_for_delivery",
  "delivered",
];

function label(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchOrder() {
    if (!orderNumber.trim() || !phone.trim()) {
      setError("Please enter Order ID and phone number.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);
    setItems([]);

    const { data, error: rpcError } =
      await supabase.rpc("get_customer_order", {
        p_order_number: orderNumber.trim(),
        p_phone: phone.trim(),
      });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    if (!data?.success) {
      setError(
        data?.message ||
          "Order not found."
      );
      setLoading(false);
      return;
    }

    setOrder(data.order as Order);
    setItems((data.items || []) as OrderItem[]);

    setLoading(false);
  }

  function currentStep() {
    if (!order) return -1;

    if (order.order_status === "cancelled") {
      return -1;
    }

    return steps.indexOf(order.order_status);
  }

  async function cancelOrder() {
    if (!order) return;

    if (
      !window.confirm(
        "Are you sure you want to cancel this order?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
      })
      .eq("id", order.id);

    if (error) {
      setError(error.message);
      return;
    }

    setOrder({
      ...order,
      order_status: "cancelled",
    });
  }

  return (
    <main className="min-h-screen bg-[#0d0d0c] px-4 py-10 text-white sm:px-6">

      <div className="mx-auto max-w-4xl">

        <div className="text-center">

          <p className="text-xs uppercase tracking-[0.35em] text-[#d8bd73]">
            Order Tracking
          </p>

          <h1 className="mt-4 text-4xl font-semibold">
            Track Your Order
          </h1>

          <p className="mt-3 text-sm text-white/40">
            Enter your Order ID and phone number.
          </p>

        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">

          <div className="grid gap-4 sm:grid-cols-2">

            <input
              value={orderNumber}
              onChange={(e) =>
                setOrderNumber(e.target.value)
              }
              placeholder="Order ID e.g. AGP-20260819-123456"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
            />

            <input
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="Mobile number"
              inputMode="tel"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
            />

          </div>

          <button
            onClick={searchOrder}
            disabled={loading}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-[#c7a95c] to-[#f0d98f] px-6 py-3 font-semibold text-[#17150f] disabled:opacity-50"
          >
            {loading ? "Searching..." : "Track Order"}
          </button>

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

        </div>

        {order && (
          <div className="mt-8 space-y-6">

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">

              <div className="flex flex-col justify-between gap-4 sm:flex-row">

                <div>
                  <p className="text-xs text-white/30">
                    Order ID
                  </p>

                  <h2 className="mt-2 font-mono text-xl text-[#e8d69d]">
                    {order.order_number}
                  </h2>
                </div>

                <div className="text-left sm:text-right">

                  <p className="text-xs text-white/30">
                    Status
                  </p>

                  <p
                    className={`mt-2 inline-block rounded-full px-4 py-2 text-xs ${
                      order.order_status === "cancelled"
                        ? "bg-red-400/10 text-red-300"
                        : "bg-[#d8bd73]/10 text-[#e8d69d]"
                    }`}
                  >
                    {label(order.order_status)}
                  </p>

                </div>

              </div>

              {order.order_status === "cancelled" ? (
                <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-center text-red-200">
                  This order has been cancelled.
                </div>
              ) : (
                <div className="mt-10">

                  <div className="space-y-6">

                    {steps.map((step, index) => {
                      const active = index <= currentStep();

                      return (
                        <div
                          key={step}
                          className="flex items-center gap-4"
                        >

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                              active
                                ? "bg-[#d8bd73] text-[#17150f]"
                                : "border border-white/10 bg-white/[0.03] text-white/30"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div>
                            <p
                              className={
                                active
                                  ? "font-medium text-white"
                                  : "text-white/30"
                              }
                            >
                              {label(step)}
                            </p>

                            {index === currentStep() && (
                              <p className="mt-1 text-xs text-[#d8bd73]">
                                Current status
                              </p>
                            )}
                          </div>

                        </div>
                      );
                    })}

                  </div>

                </div>
              )}

            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">

              <h2 className="text-xl font-medium">
                Delivery Details
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/60">
                {order.customer_name}
                <br />
                {order.customer_phone}
                <br />
                {order.address}
                <br />
                {order.city}, {order.state}
                <br />
                PIN: {order.pincode}
              </p>

            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">

              <h2 className="text-xl font-medium">
                Ordered Items
              </h2>

              <div className="mt-5 space-y-3">

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                  >

                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          🧈
                        </div>
                      )}
                    </div>

                    <div className="flex-1">

                      <p className="font-medium">
                        {item.product_name}
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        {item.size} × {item.quantity}
                      </p>

                    </div>

                    <p>
                      ₹{Number(item.price) * Number(item.quantity)}
                    </p>

                  </div>
                ))}

              </div>

              <div className="mt-6 flex justify-between border-t border-white/10 pt-6">

                <span className="text-white/40">
                  Total
                </span>

                <span className="text-2xl font-semibold text-[#e8d69d]">
                  ₹{Number(order.total_amount)}
                </span>

              </div>

            </section>

            <div className="flex flex-wrap gap-3">

              <a
                href={`/invoice/${order.id}`}
                target="_blank"
                className="flex-1 rounded-full bg-gradient-to-r from-[#c7a95c] to-[#f0d98f] px-6 py-3 text-center text-sm font-semibold text-[#17150f]"
              >
                Download Invoice
              </a>

              {![
                "cancelled",
                "pickup",
                "shipped",
                "out_for_delivery",
                "delivered",
              ].includes(order.order_status) && (
                <button
                  onClick={cancelOrder}
                  className="rounded-full border border-red-400/20 px-6 py-3 text-sm text-red-300 hover:bg-red-400/10"
                >
                  Cancel Order
                </button>
              )}

            </div>

          </div>
        )}

      </div>

    </main>
  );
}