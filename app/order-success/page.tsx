"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem("makhan-last-order");

    if (savedOrder) {
      try {
        setOrder(JSON.parse(savedOrder));
      } catch {
        setOrder(null);
      }
    }
  }, []);

  if (!order) {
    return (
      <main className="min-h-screen bg-[#faf9f6] text-[#1c1c1c]">
        <header className="border-b border-black/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link href="/">
              <h1 className="text-2xl font-semibold">MAKHAN</h1>
              <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">
                Pure. Rich. Traditional.
              </p>
            </Link>

            <Link
              href="/"
              className="rounded-full border border-black px-5 py-2 text-sm"
            >
              Home
            </Link>
          </div>
        </header>

        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">
              Order information not found
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Please place an order first.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-block rounded-full bg-black px-7 py-3 text-sm text-white"
            >
              Shop Makhan
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1c1c1c]">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/">
            <h1 className="text-2xl font-semibold">MAKHAN</h1>

            <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">
              Pure. Rich. Traditional.
            </p>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-black px-5 py-2 text-sm transition hover:bg-black hover:text-white"
          >
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black text-3xl text-white">
            ✓
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-black/40">
            Order Confirmed
          </p>

          <h1 className="mt-4 text-4xl font-semibold">
            Thank You, {order.customer?.name || "Customer"}!
          </h1>

          <p className="mt-4 text-sm leading-6 text-black/50">
            Your order has been successfully placed.
          </p>
        </div>

        <div className="mt-12 rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8">
          <div className="border-b border-black/10 pb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-black/40">
              Order Number
            </p>

            <p className="mt-2 text-xl font-semibold">
              {order.orderId}
            </p>
          </div>

          <div className="py-7">
            <p className="text-xs uppercase tracking-[0.25em] text-black/40">
              Order Details
            </p>

            <div className="mt-5 space-y-4">
              {order.items?.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-black/5 pb-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.productName}
                    </p>

                    <p className="mt-1 text-xs text-black/40">
                      {item.size} × {item.quantity}
                    </p>
                  </div>

                  <p className="text-sm font-semibold">
                    ₹{Number(item.price) * Number(item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-black/10 pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-black/50">
                Subtotal
              </span>

              <span>₹{order.subtotal}</span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-black/50">
                Delivery
              </span>

              <span>
                {Number(order.delivery) === 0
                  ? "FREE"
                  : `₹${order.delivery}`}
              </span>
            </div>

            <div className="mt-5 flex justify-between border-t border-black/10 pt-5">
              <span className="font-medium">
                Total
              </span>

              <span className="text-2xl font-semibold">
                ₹{order.total}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-black/10 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-black/40">
            Delivery Details
          </p>

          <div className="mt-5 space-y-3 text-sm">
            <p>
              <span className="text-black/40">Name:</span>{" "}
              {order.customer?.name}
            </p>

            <p>
              <span className="text-black/40">Mobile:</span>{" "}
              {order.customer?.mobile}
            </p>

            <p>
              <span className="text-black/40">Address:</span>{" "}
              {order.customer?.address}
            </p>

            <p>
              <span className="text-black/40">PIN Code:</span>{" "}
              {order.customer?.pincode}
            </p>

            <p>
              <span className="text-black/40">Payment:</span>{" "}
              Cash on Delivery
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-block rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition hover:opacity-80"
          >
            Continue Shopping
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl justify-between text-sm text-black/50">
          <p>© 2026 MAKHAN. All rights reserved.</p>

          <p>Pure. Rich. Traditional.</p>
        </div>
      </footer>
    </main>
  );
}