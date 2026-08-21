"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type CartItem = {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
};

type CreatedOrder = {
  id: string;
  order_number: string;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");

  const [message, setMessage] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState<CreatedOrder | null>(
    null
  );

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("makhan-cart");

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch {
      setCart([]);
    }

    setLoaded(true);
  }, []);

  const subtotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );

  const delivery = 0;
  const total = subtotal + delivery;

  function validateForm() {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMobile = mobile.trim();
    const cleanState = state.trim();
    const cleanCity = city.trim();
    const cleanPincode = pincode.trim();
    const cleanAddress = address.trim();

    if (!cleanName) {
      setMessage("Please enter your full name.");
      return false;
    }

    if (cleanName.length < 3) {
      setMessage("Please enter a valid full name.");
      return false;
    }

    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMessage("Please enter a valid email address.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return false;
    }

    if (!cleanState) {
      setMessage("Please enter your state.");
      return false;
    }

    if (cleanState.length < 2) {
      setMessage("Please enter a valid state.");
      return false;
    }

    if (!cleanCity) {
      setMessage("Please enter your city.");
      return false;
    }

    if (cleanCity.length < 2) {
      setMessage("Please enter a valid city.");
      return false;
    }

    if (!/^\d{6}$/.test(cleanPincode)) {
      setMessage("Please enter a valid 6-digit PIN code.");
      return false;
    }

    if (!cleanAddress) {
      setMessage("Please enter your complete delivery address.");
      return false;
    }

    if (cleanAddress.length < 10) {
      setMessage("Please enter a more complete delivery address.");
      return false;
    }

    return true;
  }

  function validateCartItems() {
    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return false;
    }

    for (const item of cart) {
      if (!item.productId) {
        setMessage(
          `Product ID is missing for "${item.productName || "product"}". Please remove this item and add it again.`
        );
        return false;
      }

      if (!item.variantId) {
        setMessage(
          `Variant ID is missing for "${item.productName || "product"}". Please remove this item and add it again.`
        );
        return false;
      }

      if (!item.productName) {
        setMessage("Product name is missing.");
        return false;
      }

      if (!item.size) {
        setMessage(
          `Pack size is missing for "${item.productName}".`
        );
        return false;
      }

      if (
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0
      ) {
        setMessage(
          `Invalid price for "${item.productName}".`
        );
        return false;
      }

      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        setMessage(
          `Invalid quantity for "${item.productName}".`
        );
        return false;
      }
    }

    return true;
  }

  async function placeOrder() {
    setMessage("");
    setOrderCreated(null);

    if (!validateCartItems()) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setPlacingOrder(true);

    let createdOrderId: string | null = null;

    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim();
      const cleanMobile = mobile.trim();
      const cleanState = state.trim();
      const cleanCity = city.trim();
      const cleanPincode = pincode.trim();
      const cleanAddress = address.trim();

      /*
       * Create unique order number.
       */
      const orderNumber = `MK${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;

      /*
       * STEP 1
       * Create main order.
       */
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,

          customer_name: cleanName,
          customer_email: cleanEmail,
          customer_mobile: cleanMobile,
          customer_phone: cleanMobile,

          customer_state: cleanState,
          customer_city: cleanCity,
          customer_address: cleanAddress,
          customer_pincode: cleanPincode,

          payment_method: "Online Payment",

          subtotal: subtotal,
          delivery_charge: delivery,
          total: total,

          status: "pending_payment",
        })
        .select("id, order_number")
        .single();

      if (orderError) {
        console.error(
          "ORDER CREATE ERROR:",
          JSON.stringify(orderError, null, 2)
        );

        throw new Error(
          orderError.message || "Unable to create order."
        );
      }

      if (!orderData?.id) {
        throw new Error(
          "Order was created but Supabase did not return the order ID."
        );
      }

      createdOrderId = orderData.id;

      /*
       * STEP 2
       *
       * Save every cart product inside order_items.
       *
       * IMPORTANT:
       *
       * order_id = actual UUID from orders.id
       * product_id = cart product UUID
       * variant_id = cart variant UUID
       */
      const orderItems = cart.map((item) => ({
        order_id: createdOrderId,

        product_id: item.productId,

        product_name: item.productName,

        variant_id: item.variantId,

        size: item.size,

        price: Number(item.price),

        quantity: Number(item.quantity),

        /*
         * Your Supabase column is exactly:
         * image_ur1
         *
         * It is nullable, so empty image is allowed.
         */
        image_ur1: item.image || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error(
          "ORDER ITEMS ERROR:",
          JSON.stringify(itemsError, null, 2)
        );

        /*
         * If items fail, remove the empty main order.
         */
        await supabase
          .from("orders")
          .delete()
          .eq("id", createdOrderId);

        createdOrderId = null;

        throw new Error(
          `Order items could not be saved: ${itemsError.message}`
        );
      }

      /*
       * STEP 3
       * Save order locally for the success/track page.
       */
      const localOrder = {
        orderId: orderData.order_number,
        databaseOrderId: orderData.id,

        customer: {
          name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          state: cleanState,
          city: cleanCity,
          pincode: cleanPincode,
          address: cleanAddress,
        },

        items: cart,

        subtotal: subtotal,
        delivery: delivery,
        total: total,

        paymentMethod: "Online Payment",
        paymentStatus: "pending",

        status: "pending_payment",

        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "makhan-last-order",
        JSON.stringify(localOrder)
      );

      /*
       * STEP 4
       *
       * Clear cart because the order itself
       * has successfully been created.
       */
      localStorage.removeItem("makhan-cart");

      setCart([]);

      setOrderCreated({
        id: orderData.id,
        order_number: orderData.order_number,
      });

      setMessage(
        "✓ Order created successfully. Your order is waiting for online payment."
      );
    } catch (error) {
      console.error(
        "CHECKOUT ERROR:",
        JSON.stringify(error, null, 2)
      );

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Something went wrong while creating your order."
        );
      }
    } finally {
      setPlacingOrder(false);
    }
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f7f3]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-black" />

          <p className="mt-4 text-sm text-black/45">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ORDER CREATED
   */
  if (orderCreated) {
    return (
      <main className="min-h-screen bg-[#f8f7f3] text-[#171717]">
        <header className="border-b border-black/10 bg-[#f8f7f3]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
            <Link href="/" className="block">
              <h1 className="text-2xl font-semibold tracking-tight">
                MAKHAN
              </h1>

              <p className="text-[10px] uppercase tracking-[0.35em] text-black/45">
                Pure. Rich. Traditional.
              </p>
            </Link>
          </div>
        </header>

        <section className="flex min-h-[75vh] items-center justify-center px-5 py-16">
          <div className="w-full max-w-xl rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">
              ✓
            </div>

            <p className="mt-7 text-xs uppercase tracking-[0.3em] text-black/35">
              Order Created
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Thank You!
            </h1>

            <p className="mt-4 text-sm leading-7 text-black/45">
              Your order has been created successfully.
              Online payment is the next step.
            </p>

            <div className="mt-8 rounded-2xl bg-[#f8f7f3] p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-black/35">
                Order Number
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {orderCreated.order_number}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 p-5 text-left">
              <p className="text-sm font-semibold">
                Payment Status
              </p>

              <p className="mt-2 text-sm leading-6 text-black/45">
                Pending payment. The online payment gateway will
                be connected next.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="flex-1 rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-80"
              >
                Back to Home
              </Link>

              <Link
                href={`/track-order?order=${encodeURIComponent(
                  orderCreated.order_number
                )}`}
                className="flex-1 rounded-full border border-black px-6 py-4 text-sm font-semibold transition hover:bg-black hover:text-white"
              >
                Track Order
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
   * EMPTY CART
   */
  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#f8f7f3] text-[#171717]">
        <header className="border-b border-black/10 bg-[#f8f7f3]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
            <Link href="/" className="block">
              <h1 className="text-2xl font-semibold tracking-tight">
                MAKHAN
              </h1>

              <p className="text-[10px] uppercase tracking-[0.35em] text-black/45">
                Pure. Rich. Traditional.
              </p>
            </Link>

            <Link
              href="/products"
              className="rounded-full border border-black px-5 py-2.5 text-sm transition hover:bg-black hover:text-white"
            >
              Shop
            </Link>
          </div>
        </header>

        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="w-full max-w-lg text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
              🛒
            </div>

            <p className="mt-7 text-xs uppercase tracking-[0.3em] text-black/35">
              Checkout
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Your cart is empty
            </h1>

            <p className="mt-4 text-sm leading-7 text-black/45">
              Add your favourite makhan to the cart before
              proceeding to checkout.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition hover:opacity-80"
            >
              Shop Makhan
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3] text-[#171717]">
      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f8f7f3]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
          <Link href="/" className="block">
            <h1 className="text-2xl font-semibold tracking-tight">
              MAKHAN
            </h1>

            <p className="text-[10px] uppercase tracking-[0.35em] text-black/45">
              Pure. Rich. Traditional.
            </p>
          </Link>

          <Link
            href="/cart"
            className="rounded-full border border-black px-5 py-2.5 text-sm transition hover:bg-black hover:text-white"
          >
            Back to Cart
          </Link>
        </div>
      </header>

      {/* MAIN */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-black/35">
            Secure Checkout
          </p>

          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Complete Your Order
          </h2>

          <p className="mt-4 text-sm leading-7 text-black/45">
            Enter your delivery details and continue with
            secure online payment.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-10">
          {/* LEFT */}

          <div className="space-y-6">
            {/* DELIVERY DETAILS */}

            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/35">
                    Step 1
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold">
                    Delivery Details
                  </h3>

                  <p className="mt-2 text-sm text-black/45">
                    Tell us where you want your order delivered.
                  </p>
                </div>

                <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#f3f0e9] text-sm font-semibold sm:flex">
                  01
                </div>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mobile"
                    className="mb-2 block text-sm font-medium"
                  >
                    Mobile Number
                  </label>

                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) =>
                      setMobile(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-sm font-medium"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    type="text"
                    autoComplete="address-level1"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Bihar"
                    className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Forbesganj"
                    className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="pincode"
                    className="mb-2 block text-sm font-medium"
                  >
                    PIN Code
                  </label>

                  <input
                    id="pincode"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) =>
                      setPincode(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="6-digit PIN code"
                    className="w-full rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium"
                  >
                    Full Delivery Address
                  </label>

                  <textarea
                    id="address"
                    rows={5}
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Flat No., Street, Area, Landmark..."
                    className="w-full resize-none rounded-xl border border-black/15 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white"
                  />

                  <p className="mt-2 text-xs text-black/35">
                    Include house number, street/area and a
                    landmark if available.
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT */}

            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/35">
                    Step 2
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold">
                    Payment Method
                  </h3>

                  <p className="mt-2 text-sm text-black/45">
                    Online payment is the only available payment
                    method.
                  </p>
                </div>

                <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#f3f0e9] text-sm font-semibold sm:flex">
                  02
                </div>
              </div>

              <div className="mt-7 rounded-2xl border-2 border-black bg-[#faf9f6] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-lg text-white">
                    ₹
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Online Payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-black/45">
                      Secure online payment. Payment gateway will
                      be connected separately.
                    </p>
                  </div>

                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
                    ✓
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-sm font-medium">
                    Secure
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Protected payment
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-sm font-medium">
                    Fast
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Quick checkout
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-sm font-medium">
                    Easy
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Simple online payment
                  </p>
                </div>
              </div>
            </div>

            {/* MESSAGE */}

            {message && (
              <div className="rounded-2xl border border-black/10 bg-[#f3f0e9] px-5 py-4 text-sm leading-6 text-black/70">
                {message}
              </div>
            )}

            {/* PLACE ORDER */}

            <button
              type="button"
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full rounded-full bg-black px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placingOrder
                ? "Creating Order..."
                : `Continue to Online Payment • ₹${total}`}
            </button>

            <p className="text-center text-xs leading-5 text-black/35">
              Your order will be created first. Online payment
              gateway will be connected after the order system is
              confirmed working.
            </p>
          </div>

          {/* RIGHT */}

          <aside className="h-fit rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-7 lg:sticky lg:top-24">
            <p className="text-xs uppercase tracking-[0.3em] text-black/35">
              Your Order
            </p>

            <h3 className="mt-2 text-2xl font-semibold">
              Order Summary
            </h3>

            <div className="mt-7 space-y-5">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-4"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eee9df]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold">
                        MAKHAN
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-5">
                      {item.productName}
                    </p>

                    <p className="mt-1 text-xs text-black/40">
                      Pack: {item.size}
                    </p>

                    <p className="mt-1 text-xs text-black/40">
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

            <div className="mt-7 space-y-4 border-t border-black/10 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50">
                  Subtotal
                </span>

                <span className="font-medium">
                  ₹{subtotal}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50">
                  Delivery
                </span>

                <span className="font-medium">
                  FREE
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between border-t border-black/10 pt-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-black/35">
                  Total
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  ₹{total}
                </p>
              </div>

              <span className="rounded-full bg-[#f3f0e9] px-3 py-1.5 text-xs font-medium">
                Online
              </span>
            </div>

            <div className="mt-7 rounded-2xl bg-[#faf9f6] p-4">
              <p className="text-xs font-medium">
                Order protection
              </p>

              <p className="mt-2 text-xs leading-5 text-black/40">
                Your order details will be securely stored before
                payment is completed.
              </p>
            </div>

            <Link
              href="/cart"
              className="mt-5 block text-center text-sm text-black/45 underline underline-offset-4 hover:text-black"
            >
              Edit cart
            </Link>
          </aside>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-black/10 bg-white px-5 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-black/45 sm:flex-row">
          <p>
            © 2026 MAKHAN. All rights reserved.
          </p>

          <p>
            Pure. Rich. Traditional.
          </p>
        </div>
      </footer>
    </main>
  );
}