"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
};

type Variant = {
  id: string;
  product_id: string;
  size: string;
  price: number;
  stock: number;
  is_active: boolean;
};

type SocialSettings = {
  instagram: string;
  facebook: string;
  youtube: string;
};

const defaultSocial: SocialSettings = {
  instagram: "",
  facebook: "",
  youtube: "",
};

function makeUrl(url: string) {
  const clean = url.trim();

  if (!clean) {
    return "";
  }

  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://")
  ) {
    return clean;
  }

  return `https://${clean}`;
}

export default function Home() {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<Variant | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const [social, setSocial] =
    useState<SocialSettings>(defaultSocial);

  useEffect(() => {
    loadProduct();
    loadSocialSettings();
  }, []);

  async function loadSocialSettings() {
    const { data, error } = await supabase
      .from("store_social")
      .select("instagram, facebook, youtube")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Social settings error:", error);
      return;
    }

    if (data) {
      setSocial({
        instagram: data.instagram ?? "",
        facebook: data.facebook ?? "",
        youtube: data.youtube ?? "",
      });
    }
  }

  async function loadProduct() {
    setLoading(true);

    const { data: products, error: productError } =
      await supabase
        .from("products")
        .select(
          "id, name, description, image_url, is_active"
        )
        .eq("is_active", true)
        .order("created_at", {
          ascending: true,
        })
        .limit(1);

    if (
      productError ||
      !products ||
      products.length === 0
    ) {
      setProduct(null);
      setVariants([]);
      setLoading(false);
      return;
    }

    const currentProduct = products[0];

    setProduct(currentProduct);

    const { data: variantData } = await supabase
      .from("product_variants")
      .select(
        "id, product_id, size, price, stock, is_active"
      )
      .eq("product_id", currentProduct.id)
      .eq("is_active", true)
      .order("price", {
        ascending: true,
      });

    const availableVariants = variantData ?? [];

    setVariants(availableVariants);

    const firstAvailable =
      availableVariants.find(
        (variant) => variant.stock > 0
      ) ?? availableVariants[0];

    if (firstAvailable) {
      setSelectedVariant(firstAvailable);

      setQuantity(
        firstAvailable.stock > 0 ? 1 : 0
      );
    }

    setLoading(false);
  }

  function selectVariant(variant: Variant) {
    if (variant.stock <= 0) {
      return;
    }

    setSelectedVariant(variant);
    setQuantity(1);
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  }

  function increaseQuantity() {
    if (!selectedVariant) {
      return;
    }

    if (
      quantity < selectedVariant.stock
    ) {
      setQuantity((current) => current + 1);
    }
  }

  function addToCart() {
    if (
      !product ||
      !selectedVariant ||
      selectedVariant.stock <= 0
    ) {
      return;
    }

    const cartItem = {
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      size: selectedVariant.size,
      price: selectedVariant.price,
      quantity,
      image: product.image_url || "",
    };

    let cart = [];

    try {
      cart = JSON.parse(
        localStorage.getItem("makhan-cart") || "[]"
      );
    } catch {
      cart = [];
    }

    const existingIndex = cart.findIndex(
      (item: {
        productId: string;
        variantId: string;
      }) =>
        item.productId === cartItem.productId &&
        item.variantId === cartItem.variantId
    );

    if (existingIndex >= 0) {
      const newQuantity =
        Number(cart[existingIndex].quantity) +
        quantity;

      cart[existingIndex].quantity = Math.min(
        newQuantity,
        selectedVariant.stock
      );
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem(
      "makhan-cart",
      JSON.stringify(cart)
    );

    window.location.href = "/cart";
  }

  function buyNow() {
    if (
      !product ||
      !selectedVariant ||
      selectedVariant.stock <= 0
    ) {
      return;
    }

    const cartItem = {
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      size: selectedVariant.size,
      price: selectedVariant.price,
      quantity,
      image: product.image_url || "",
    };

    localStorage.setItem(
      "makhan-cart",
      JSON.stringify([cartItem])
    );

    window.location.href = "/checkout";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] text-[#1c1c1c]">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-black/40">
            MAKHAN
          </p>

          <p className="mt-4 text-sm text-black/40">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#1c1c1c]">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-black/40">
            MAKHAN
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            Product unavailable
          </h1>

          <p className="mt-3 text-sm text-black/40">
            Please check again later.
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-7 rounded-full bg-black px-7 py-3 text-sm text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const instagramUrl = makeUrl(
    social.instagram
  );

  const facebookUrl = makeUrl(
    social.facebook
  );

  const youtubeUrl = makeUrl(
    social.youtube
  );

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1c1c1c]">

      {/* ================= NAVBAR ================= */}

      <header className="border-b border-black/10 bg-[#faf9f6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <a href="/" className="block">
            <h1 className="text-2xl font-semibold tracking-tight">
              MAKHAN
            </h1>

            <p className="text-[10px] uppercase tracking-[0.35em] text-black/50">
              Pure. Rich. Traditional.
            </p>
          </a>

          <nav className="hidden items-center gap-8 text-sm md:flex">

            <a
              href="/"
              className="transition hover:opacity-50"
            >
              Home
            </a>

            <a
              href="#product"
              className="transition hover:opacity-50"
            >
              Our Makhan
            </a>

            <a
              href="#about"
              className="transition hover:opacity-50"
            >
              Our Story
            </a>

          </nav>

          <a
            href="/cart"
            className="rounded-full border border-black px-5 py-2 text-sm transition hover:bg-black hover:text-white"
          >
            Cart
          </a>

        </div>
      </header>

      {/* ================= HERO ================= */}

      <section className="mx-auto grid min-h-[75vh] max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">

        <div>

          <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-black/50">
            Traditionally Crafted
          </p>

          <h2 className="max-w-xl text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Pure goodness,
            <br />

            <span className="italic">
              made with love.
            </span>
          </h2>

          <p className="mt-7 max-w-lg text-base leading-7 text-black/60">
            Rich, creamy and made with care. Discover the simple
            taste of premium traditional makhan, crafted for
            everyday indulgence.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">

            <a
              href="#product"
              className="rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:scale-[1.02]"
            >
              Shop Makhan
            </a>

            <a
              href="#about"
              className="rounded-full border border-black/20 px-7 py-3.5 text-sm font-medium transition hover:border-black"
            >
              Our Story
            </a>

          </div>

        </div>

        <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#eee9df]">

          <div className="absolute h-72 w-72 rounded-full bg-[#f4c95d]/40 blur-3xl" />

          <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-black/10 bg-[#f7f2e8] shadow-2xl">

            <div className="text-center">

              <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                Premium
              </p>

              <p className="mt-2 text-5xl font-semibold tracking-tight">
                MAKHAN
              </p>

              <p className="mt-3 text-sm italic text-black/50">
                Pure & Traditional
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ================= TRUST ================= */}

      <section className="border-y border-black/10 bg-white">

        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-black/10 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

          <div className="px-6 py-8 text-center">
            <p className="text-sm font-medium">
              100% Quality
            </p>

            <p className="mt-1 text-xs text-black/50">
              Carefully selected ingredients
            </p>
          </div>

          <div className="px-6 py-8 text-center">
            <p className="text-sm font-medium">
              Freshly Packed
            </p>

            <p className="mt-1 text-xs text-black/50">
              Packed with care for freshness
            </p>
          </div>

          <div className="px-6 py-8 text-center">
            <p className="text-sm font-medium">
              Made with Care
            </p>

            <p className="mt-1 text-xs text-black/50">
              Inspired by traditional goodness
            </p>
          </div>

        </div>

      </section>

      {/* ================= PRODUCT ================= */}

      <section
        id="product"
        className="mx-auto max-w-7xl px-6 py-24"
      >

        <div className="max-w-2xl">

          <p className="text-xs uppercase tracking-[0.35em] text-black/50">
            Our Signature Product
          </p>

          <h3 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
            {product.name}
          </h3>

          <p className="mt-5 leading-7 text-black/60">
            {product.description ||
              "Rich, creamy and traditionally inspired. Choose the pack size that works best for you."}
          </p>

        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2">

          {/* PRODUCT IMAGE */}

          <div className="flex min-h-[500px] items-center justify-center rounded-[2rem] bg-[#eee9df] p-8">

            {product.image_url ? (

              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-[460px] w-full object-contain"
              />

            ) : (

              <div className="rounded-3xl bg-[#f7f2e8] px-16 py-20 text-center shadow-xl">

                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Premium
                </p>

                <h4 className="mt-3 text-4xl font-semibold tracking-tight">
                  MAKHAN
                </h4>

                <p className="mt-3 text-sm italic text-black/50">
                  Pure & Traditional
                </p>

              </div>

            )}

          </div>

          {/* PRODUCT DETAILS */}

          <div className="flex flex-col justify-center">

            <p className="text-sm uppercase tracking-[0.25em] text-black/40">
              Signature Collection
            </p>

            <h4 className="mt-4 text-3xl font-medium">
              {product.name}
            </h4>

            <p className="mt-5 leading-7 text-black/60">
              {product.description ||
                "A rich and creamy makhan made with care for those who appreciate authentic taste and quality."}
            </p>

            {/* PACK SIZES */}

            <div className="mt-8">

              <p className="mb-3 text-sm font-medium">
                Choose your pack
              </p>

              {variants.length > 0 ? (

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                  {variants.map((variant) => {

                    const selected =
                      selectedVariant?.id === variant.id;

                    const outOfStock =
                      variant.stock <= 0;

                    return (

                      <button
                        key={variant.id}
                        type="button"
                        disabled={outOfStock}
                        onClick={() =>
                          selectVariant(variant)
                        }
                        className={`rounded-xl border px-4 py-4 text-center transition ${
                          selected
                            ? "border-black bg-black text-white"
                            : "border-black/15 bg-white hover:border-black hover:bg-black hover:text-white"
                        } ${
                          outOfStock
                            ? "cursor-not-allowed opacity-35"
                            : ""
                        }`}
                      >

                        <span className="block text-sm font-medium">
                          {variant.size}
                        </span>

                        <span className="mt-1 block text-xs opacity-60">
                          ₹{variant.price}
                        </span>

                        {outOfStock && (
                          <span className="mt-2 block text-[9px] uppercase tracking-wider opacity-60">
                            Out of Stock
                          </span>
                        )}

                        {selected && (
                          <span className="mt-2 block text-[10px] uppercase tracking-wider opacity-70">
                            Selected ✓
                          </span>
                        )}

                      </button>

                    );
                  })}

                </div>

              ) : (

                <div className="rounded-xl border border-black/10 bg-white px-5 py-4 text-sm text-black/50">
                  Pack sizes are currently unavailable.
                </div>

              )}

            </div>

            {/* PRICE */}

            {selectedVariant && (
              <div className="mt-8">

                <span className="text-3xl font-semibold">
                  ₹{selectedVariant.price * quantity}
                </span>

                <span className="ml-2 text-sm text-black/40">
                  {quantity > 1
                    ? `total for ${quantity} × ${selectedVariant.size}`
                    : `/ ${selectedVariant.size}`}
                </span>

              </div>
            )}

            {/* QUANTITY */}

            {selectedVariant &&
              selectedVariant.stock > 0 && (

                <div className="mt-7 flex items-center gap-4">

                  <p className="text-sm font-medium">
                    Quantity
                  </p>

                  <div className="flex items-center rounded-full border border-black/15">

                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="px-4 py-2 text-lg transition hover:bg-black/5 disabled:opacity-30"
                    >
                      −
                    </button>

                    <span className="min-w-10 px-3 text-center text-sm">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={
                        quantity >=
                        selectedVariant.stock
                      }
                      className="px-4 py-2 text-lg transition hover:bg-black/5 disabled:opacity-30"
                    >
                      +
                    </button>

                  </div>

                  <span className="text-xs text-black/40">
                    {selectedVariant.stock} available
                  </span>

                </div>

              )}

            {/* ADD TO CART */}

            <button
              type="button"
              onClick={addToCart}
              disabled={
                !selectedVariant ||
                selectedVariant.stock <= 0
              }
              className="mt-8 w-full rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {!selectedVariant
                ? "Choose a Pack"
                : selectedVariant.stock <= 0
                ? "Out of Stock"
                : "Add to Cart"}
            </button>

            {/* BUY NOW */}

            <button
              type="button"
              onClick={buyNow}
              disabled={
                !selectedVariant ||
                selectedVariant.stock <= 0
              }
              className="mt-3 w-full rounded-full border border-black px-8 py-4 text-sm font-medium transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {!selectedVariant
                ? "Choose a Pack"
                : selectedVariant.stock <= 0
                ? "Out of Stock"
                : "Buy Now"}
            </button>

            {/* SMALL INFORMATION */}

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-black/10 pt-6 text-center">

              <div>
                <p className="text-xs font-medium">
                  Fresh
                </p>

                <p className="mt-1 text-[10px] text-black/40">
                  Carefully packed
                </p>
              </div>

              <div>
                <p className="text-xs font-medium">
                  Quality
                </p>

                <p className="mt-1 text-[10px] text-black/40">
                  Premium product
                </p>
              </div>

              <div>
                <p className="text-xs font-medium">
                  Support
                </p>

                <p className="mt-1 text-[10px] text-black/40">
                  We're here to help
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= STORY ================= */}

      <section
        id="about"
        className="bg-[#1c1c1c] px-6 py-24 text-white"
      >

        <div className="mx-auto max-w-4xl text-center">

          <p className="text-xs uppercase tracking-[0.35em] text-white/40">
            Our Philosophy
          </p>

          <h3 className="mt-5 text-4xl font-medium leading-tight sm:text-5xl">
            Simple ingredients.
            <br />
            Honest taste.
          </h3>

          <p className="mx-auto mt-7 max-w-2xl leading-7 text-white/60">
            We believe great food does not need to be complicated.
            Our makhan is inspired by the timeless taste of
            traditional Indian kitchens.
          </p>

        </div>

      </section>

      {/* ================= SUPPORT + SOCIAL ================= */}

      <section className="border-t border-black/10 bg-[#f3f0e9] px-6 py-20">

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-12 md:grid-cols-3">

            {/* BRAND */}

            <div>

              <h3 className="text-2xl font-semibold tracking-tight">
                MAKHAN
              </h3>

              <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-black/40">
                Pure. Rich. Traditional.
              </p>

              <p className="mt-6 max-w-sm text-sm leading-6 text-black/55">
                Made with care, inspired by traditional taste and
                created for people who appreciate simple, honest
                goodness.
              </p>

            </div>

            {/* CUSTOMER SUPPORT */}

            <div>

              <p className="text-xs font-medium uppercase tracking-[0.25em] text-black/40">
                Customer Support
              </p>

              <h4 className="mt-4 text-xl font-medium">
                Need help?
              </h4>

              <p className="mt-3 text-sm leading-6 text-black/55">
                Have a question about your order, delivery or
                product? Our support team is here to help.
              </p>

              <div className="mt-6 space-y-3 text-sm">

                <a
                  href="tel:+919999999999"
                  className="block transition hover:opacity-50"
                >
                  📞 +91 99999 99999
                </a>

                <a
                  href="mailto:support@example.com"
                  className="block transition hover:opacity-50"
                >
                  ✉ support@example.com
                </a>

                <a
                  href="https://wa.me/919999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition hover:opacity-50"
                >
                  💬 WhatsApp Support
                </a>

              </div>

            </div>

            {/* SOCIAL MEDIA */}

            <div>

              <p className="text-xs font-medium uppercase tracking-[0.25em] text-black/40">
                Follow Us
              </p>

              <h4 className="mt-4 text-xl font-medium">
                Stay connected.
              </h4>

              <p className="mt-3 text-sm leading-6 text-black/55">
                Follow us for new updates, product stories and more.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">

                {/* INSTAGRAM */}

                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 transition hover:bg-black hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="5"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="4"
                      />

                      <circle
                        cx="17.5"
                        cy="6.5"
                        r="0.8"
                        fill="currentColor"
                        stroke="none"
                      />
                    </svg>
                  </a>
                ) : null}

                {/* FACEBOOK */}

                {facebookUrl ? (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-sm font-semibold transition hover:bg-black hover:text-white"
                  >
                    f
                  </a>
                ) : null}

                {/* YOUTUBE */}

                {youtubeUrl ? (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 transition hover:bg-black hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.9V8.1l6.5 3.9-6.5 3.9Z" />
                    </svg>
                  </a>
                ) : null}

                {/* NO LINKS MESSAGE */}

                {!instagramUrl &&
                  !facebookUrl &&
                  !youtubeUrl && (
                    <p className="text-xs text-black/40">
                      Social media links will appear here.
                    </p>
                  )}

              </div>

            </div>

          </div>

          {/* FOOTER */}

          <div className="mt-16 flex flex-col gap-4 border-t border-black/10 pt-7 text-xs text-black/40 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © 2026 MAKHAN. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-6">

              <a
                href="#"
                className="hover:text-black"
              >
                Privacy Policy
              </a>

              <a
                href="#"
                className="hover:text-black"
              >
                Terms & Conditions
              </a>

              <a
                href="#"
                className="hover:text-black"
              >
                Shipping Policy
              </a>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}