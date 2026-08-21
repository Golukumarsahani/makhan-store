"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CartItem = {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

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

  function saveCart(updatedCart: CartItem[]) {
    setCart(updatedCart);
    localStorage.setItem(
      "makhan-cart",
      JSON.stringify(updatedCart)
    );
  }

  function increaseQuantity(index: number) {
    const updatedCart = [...cart];

    updatedCart[index].quantity += 1;

    saveCart(updatedCart);
  }

  function decreaseQuantity(index: number) {
    const updatedCart = [...cart];

    if (updatedCart[index].quantity <= 1) {
      updatedCart.splice(index, 1);
    } else {
      updatedCart[index].quantity -= 1;
    }

    saveCart(updatedCart);
  }

  function removeItem(index: number) {
    const updatedCart = [...cart];

    updatedCart.splice(index, 1);

    saveCart(updatedCart);
  }

  function clearCart() {
    setCart([]);
    localStorage.removeItem("makhan-cart");
  }

  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const delivery = subtotal > 0 ? 0 : 0;

  const total = subtotal + delivery;

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#faf9f6] text-[#1c1c1c]">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-black/40">
            Loading cart...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1c1c1c]">

      {/* Header */}

      <header className="border-b border-black/10 bg-[#faf9f6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link href="/" className="block">
            <h1 className="text-2xl font-semibold tracking-tight">
              MAKHAN
            </h1>

            <p className="text-[10px] uppercase tracking-[0.35em] text-black/50">
              Pure. Rich. Traditional.
            </p>
          </Link>

          <Link
            href="/products"
            className="rounded-full border border-black px-5 py-2.5 text-sm transition hover:bg-black hover:text-white"
          >
            Continue Shopping
          </Link>

        </div>
      </header>

      {/* Cart */}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:py-20">

        <div className="mb-10">

          <p className="text-xs uppercase tracking-[0.35em] text-black/40">
            Your Selection
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Your Cart
            </h2>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-black/40 underline underline-offset-4 transition hover:text-black"
              >
                Clear cart
              </button>
            )}

          </div>

        </div>

        {cart.length === 0 ? (

          /* Empty Cart */

          <div className="rounded-[2rem] border border-black/10 bg-white px-6 py-20 text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f0e9]">

              <span className="text-3xl">
                🛒
              </span>

            </div>

            <h3 className="mt-7 text-2xl font-semibold">
              Your cart is empty
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">
              You haven't added anything to your cart yet.
              Discover our premium traditional makhan.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:opacity-80"
            >
              Shop Makhan
            </Link>

          </div>

        ) : (

          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">

            {/* Cart Items */}

            <div className="space-y-4">

              {cart.map((item, index) => (

                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="rounded-[2rem] border border-black/10 bg-white p-5 sm:p-6"
                >

                  <div className="flex gap-5">

                    {/* Product Image */}

                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eee9df] sm:h-36 sm:w-36">

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="text-center">

                          <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">
                            Premium
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            MAKHAN
                          </p>

                        </div>
                      )}

                    </div>

                    {/* Details */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="text-xs uppercase tracking-[0.2em] text-black/35">
                            Premium Collection
                          </p>

                          <h3 className="mt-2 text-lg font-semibold sm:text-xl">
                            {item.productName}
                          </h3>

                          <p className="mt-1 text-sm text-black/45">
                            Pack: {item.size}
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(index)
                          }
                          className="text-sm text-black/35 transition hover:text-black"
                          aria-label={`Remove ${item.productName}`}
                        >
                          Remove
                        </button>

                      </div>

                      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                        {/* Quantity */}

                        <div className="flex w-fit items-center rounded-full border border-black/15">

                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(index)
                            }
                            className="px-4 py-2.5 text-lg text-black/60 transition hover:text-black"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span className="min-w-9 text-center text-sm">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(index)
                            }
                            className="px-4 py-2.5 text-lg text-black/60 transition hover:text-black"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>

                        </div>

                        {/* Price */}

                        <div className="text-left sm:text-right">

                          <p className="text-xs text-black/35">
                            ₹{item.price} × {item.quantity}
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            ₹{item.price * item.quantity}
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

            {/* Order Summary */}

            <aside className="h-fit rounded-[2rem] border border-black/10 bg-white p-6 sm:p-7 lg:sticky lg:top-6">

              <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                Order Summary
              </p>

              <h3 className="mt-3 text-2xl font-semibold">
                Your Order
              </h3>

              <div className="mt-7 space-y-4 border-b border-black/10 pb-6">

                <div className="flex justify-between text-sm">

                  <span className="text-black/50">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    ₹{subtotal}
                  </span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-black/50">
                    Delivery
                  </span>

                  <span className="font-medium">
                    {delivery === 0
                      ? "FREE"
                      : `₹${delivery}`}
                  </span>

                </div>

              </div>

              <div className="flex items-end justify-between pt-6">

                <div>

                  <p className="text-xs uppercase tracking-[0.25em] text-black/35">
                    Total
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    ₹{total}
                  </p>

                </div>

                <p className="text-xs text-black/40">
                  {cart.reduce(
                    (sum, item) =>
                      sum + item.quantity,
                    0
                  )}{" "}
                  item(s)
                </p>

              </div>

              <Link
                href="/checkout"
                className="mt-8 block w-full rounded-full bg-black px-8 py-4 text-center text-sm font-medium text-white transition hover:opacity-80"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="mt-3 block w-full rounded-full border border-black px-8 py-4 text-center text-sm font-medium transition hover:bg-black hover:text-white"
              >
                Continue Shopping
              </Link>

              <div className="mt-7 border-t border-black/10 pt-6 text-center">

                <p className="text-xs font-medium">
                  Fresh. Quality. Traditional.
                </p>

                <p className="mt-2 text-[11px] leading-5 text-black/40">
                  Thank you for choosing MAKHAN.
                  Your order will be handled with care.
                </p>

              </div>

            </aside>

          </div>

        )}

      </section>

      {/* Footer */}

      <footer className="border-t border-black/10 bg-white px-6 py-10">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-black/50 sm:flex-row">

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