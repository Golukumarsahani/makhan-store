"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type CartItem = {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  price: number;
  quantity: number;
  image?: string;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("makhan-cart");

      if (savedCart) {
        const parsed = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (error) {
      console.error("CART LOAD ERROR:", error);
    }
  }, []);

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity),
    0
  );

  const deliveryCharge = 0;
  const total = subtotal + deliveryCharge;

  function validateForm() {
    if (!name.trim()) {
      setMessage("Please enter your full name.");
      return false;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Please enter a valid email address.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return false;
    }

    if (!state.trim()) {
      setMessage("Please enter your state.");
      return false;
    }

    if (!city.trim()) {
      setMessage("Please enter your city.");
      return false;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setMessage("Please enter a valid 6-digit PIN code.");
      return false;
    }

    if (address.trim().length < 10) {
      setMessage("Please enter your complete delivery address.");
      return false;
    }

    return true;
  }

  async function createOrderInSupabase() {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: name.trim(),
        customer_phone: mobile.trim(),
        customer_email: email.trim(),

        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),

        customer_address: address.trim(),
        customer_mobile: mobile.trim(),
        customer_city: city.trim(),
        customer_state: state.trim(),
        customer_pincode: pincode.trim(),

        subtotal: subtotal,
        shipping_charge: deliveryCharge,
        delivery_charge: deliveryCharge,

        total_amount: total,
        total: total,

        payment_method: "online",
        payment_status: "pending",
        order_status: "pending",
        status: "pending_payment",
      })
      .select("id, order_number, invoice_number")
      .single();

    if (error) {
      console.error(
        "SUPABASE ORDER ERROR:",
        JSON.stringify(error, null, 2)
      );

      throw new Error(error.message);
    }

    return data;
  }

  async function createRazorpayOrder() {
    const response = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: total,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Razorpay order could not be created."
      );
    }

    return data;
  }

  async function verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    databaseOrderId: string
  ) {
    const response = await fetch("/api/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Payment verification failed."
      );
    }

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "confirmed",
        status: "paid",
        payment_method: "online",
      })
      .eq("id", databaseOrderId);

    if (error) {
      console.error(
        "ORDER UPDATE ERROR:",
        JSON.stringify(error, null, 2)
      );

      throw new Error(
        "Payment was successful but order status could not be updated."
      );
    }

    const orderData = {
      databaseOrderId: databaseOrderId,
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,

      customer: {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        state: state.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        address: address.trim(),
      },

      items: cart,

      subtotal: subtotal,
      delivery: deliveryCharge,
      total: total,

      paymentMethod: "online",
      paymentStatus: "paid",

      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "makhan-last-order",
      JSON.stringify(orderData)
    );

    localStorage.removeItem("makhan-cart");

    window.location.href = "/order-success";
  }

  async function placeOrder() {
    setMessage("");

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!razorpayReady || !window.Razorpay) {
      setMessage(
        "Payment system is loading. Please wait a moment and try again."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * 1. Create order in Supabase
       */
      const databaseOrder = await createOrderInSupabase();

      /*
       * 2. Create Razorpay Test Order
       */
      const razorpayData = await createRazorpayOrder();

      /*
       * 3. Open Razorpay Checkout
       */
      const options = {
        key: razorpayData.keyId,

        amount: razorpayData.order.amount,

        currency: razorpayData.order.currency,

        name: "MAKHAN",

        description: "Pure. Rich. Traditional.",

        order_id: razorpayData.order.id,

        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: mobile.trim(),
        },

        notes: {
          database_order_id: databaseOrder.id,
        },

        theme: {
          color: "#000000",
        },

        handler: async function (response: any) {
          try {
            setMessage("Verifying payment...");

            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              databaseOrder.id
            );
          } catch (error) {
            console.error(
              "PAYMENT VERIFICATION ERROR:",
              error
            );

            setMessage(
              error instanceof Error
                ? error.message
                : "Payment verification failed."
            );

            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setMessage(
              "Payment window closed. Your order is still pending payment."
            );

            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.open();
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );

      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#f8f7f3] text-black">
        <header className="border-b border-black/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
            <Link href="/" className="block">
              <h1 className="text-2xl font-semibold">
                MAKHAN
              </h1>

              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                Pure. Rich. Traditional.
              </p>
            </Link>

            <Link
              href="/products"
              className="rounded-full border border-black px-5 py-2 text-sm"
            >
              Shop
            </Link>
          </div>
        </header>

        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <div className="text-center">
            <h2 className="text-4xl font-semibold">
              Your cart is empty
            </h2>

            <p className="mt-3 text-black/50">
              Add a product before checkout.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-block rounded-full bg-black px-7 py-3 text-sm text-white"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
        onError={() =>
          setMessage(
            "Unable to load Razorpay. Please check your internet connection."
          )
        }
      />

      <main className="min-h-screen bg-[#f8f7f3] text-black">
        <header className="border-b border-black/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
            <Link href="/" className="block">
              <h1 className="text-2xl font-semibold">
                MAKHAN
              </h1>

              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                Pure. Rich. Traditional.
              </p>
            </Link>

            <Link
              href="/cart"
              className="rounded-full border border-black px-5 py-2 text-sm hover:bg-black hover:text-white"
            >
              Back to Cart
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">
              Secure Checkout
            </p>

            <h2 className="mt-3 text-4xl font-semibold">
              Complete Your Order
            </h2>

            <p className="mt-3 text-sm text-black/50">
              Enter your delivery details and
              continue with secure online payment.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                  Step 1
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  Delivery Details
                </h3>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Full Name
                    </label>

                    <input
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Email Address
                    </label>

                    <input
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Mobile Number
                    </label>

                    <input
                      value={mobile}
                      onChange={(e) =>
                        setMobile(
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      State
                    </label>

                    <input
                      value={state}
                      onChange={(e) =>
                        setState(e.target.value)
                      }
                      type="text"
                      placeholder="State"
                      className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      City
                    </label>

                    <input
                      value={city}
                      onChange={(e) =>
                        setCity(e.target.value)
                      }
                      type="text"
                      placeholder="City"
                      className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      PIN Code
                    </label>

                    <input
                      value={pincode}
                      onChange={(e) =>
                        setPincode(
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      type="tel"
                      maxLength={6}
                      placeholder="6-digit PIN"
                      className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Full Delivery Address
                    </label>

                    <textarea
                      value={address}
                      onChange={(e) =>
                        setAddress(e.target.value)
                      }
                      rows={5}
                      placeholder="House number, street, area, landmark..."
                      className="w-full resize-none rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                  Step 2
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  Payment Method
                </h3>

                <div className="mt-6 rounded-2xl border-2 border-black bg-[#faf9f6] p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl text-white">
                      ₹
                    </div>

                    <div>
                      <p className="font-semibold">
                        Online Payment
                      </p>

                      <p className="mt-1 text-xs text-black/50">
                        Secure payment powered by Razorpay
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {message && (
                <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/70">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={placeOrder}
                disabled={loading || !razorpayReady}
                className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : !razorpayReady
                  ? "Loading Payment..."
                  : `Continue to Online Payment • ₹${total}`}
              </button>
            </div>

            <aside className="h-fit rounded-3xl border border-black/10 bg-white p-6 lg:sticky lg:top-6">
              <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                Your Order
              </p>

              <h3 className="mt-2 text-2xl font-semibold">
                Order Summary
              </h3>

              <div className="mt-6 space-y-5">
                {cart.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.variantId}-${index}`}
                    className="flex gap-4"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#eee9df]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-semibold">
                          MAKHAN
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {item.productName}
                      </p>

                      <p className="mt-1 text-xs text-black/45">
                        Pack: {item.size}
                      </p>

                      <p className="mt-1 text-xs text-black/45">
                        Quantity: {item.quantity}
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        ₹
                        {Number(item.price) *
                          Number(item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-black/10 pt-6">
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">
                    Subtotal
                  </span>

                  <span>₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-black/50">
                    Delivery
                  </span>

                  <span>FREE</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between border-t border-black/10 pt-6">
                <span className="font-semibold">
                  Total
                </span>

                <span className="text-2xl font-semibold">
                  ₹{total}
                </span>
              </div>
            </aside>
          </div>
        </section>

        <footer className="border-t border-black/10 px-5 py-8 text-center text-sm text-black/40">
          © 2026 MAKHAN. All rights reserved.
        </footer>
      </main>
    </>
  );
}