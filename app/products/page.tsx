"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

type ProductImage = {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
};

type Variant = {
  id: string;
  size: string;
  price: number;
  stock: number;
  is_active: boolean;
};

export default function ProductsPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [selectedImage, setSelectedImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProduct();
  }, []);

  async function loadProduct() {
    setLoading(true);
    setMessage("");

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1);

    if (productError) {
      setMessage(productError.message);
      setLoading(false);
      return;
    }

    if (!products || products.length === 0) {
      setMessage("Product is currently unavailable.");
      setLoading(false);
      return;
    }

    const currentProduct = products[0];

    setProduct(currentProduct);

    // Product Images
    const { data: imageData, error: imageError } = await supabase
      .from("product_images")
      .select("id, image_url, is_primary, sort_order")
      .eq("product_id", currentProduct.id)
      .order("sort_order", { ascending: true });

    if (imageError) {
      setMessage(imageError.message);
      setLoading(false);
      return;
    }

    const productImages = imageData ?? [];

    setImages(productImages);

    if (productImages.length > 0) {
      const primary =
        productImages.find((image) => image.is_primary) ??
        productImages[0];

      setSelectedImage(primary.image_url);
    } else if (currentProduct.image_url) {
      setSelectedImage(currentProduct.image_url);
    }

    // Pack Variants
    const { data: variantData, error: variantError } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", currentProduct.id)
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (variantError) {
      setMessage(variantError.message);
      setLoading(false);
      return;
    }

    const availableVariants = variantData ?? [];

    setVariants(availableVariants);

    // Select first available pack automatically
    const firstAvailable =
      availableVariants.find((variant) => variant.stock > 0) ??
      availableVariants[0];

    if (firstAvailable) {
      setSelectedVariant(firstAvailable);
      setQuantity(firstAvailable.stock > 0 ? 1 : 0);
    }

    setLoading(false);
  }

  function selectVariant(variant: Variant) {
    if (variant.stock <= 0) {
      setMessage("This pack is currently out of stock.");
      return;
    }

    setSelectedVariant(variant);
    setQuantity(1);
    setMessage("");
  }

  function increaseQuantity() {
    if (!selectedVariant) return;

    if (quantity < selectedVariant.stock) {
      setQuantity((current) => current + 1);
    }
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function addToCart() {
    if (!product) {
      setMessage("Product is unavailable.");
      return;
    }

    if (!selectedVariant) {
      setMessage("Please choose a pack size first.");
      return;
    }

    if (selectedVariant.stock <= 0) {
      setMessage("This pack is currently out of stock.");
      return;
    }

    const cartItem = {
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      size: selectedVariant.size,
      price: selectedVariant.price,
      quantity,
      image: selectedImage || product.image_url || "",
    };

    const existingCart = JSON.parse(
      localStorage.getItem("makhan-cart") || "[]"
    );

    const existingIndex = existingCart.findIndex(
      (item: typeof cartItem) =>
        item.productId === cartItem.productId &&
        item.variantId === cartItem.variantId
    );

    if (existingIndex >= 0) {
      const newQuantity =
        existingCart[existingIndex].quantity + quantity;

      if (newQuantity > selectedVariant.stock) {
        existingCart[existingIndex].quantity = selectedVariant.stock;
      } else {
        existingCart[existingIndex].quantity = newQuantity;
      }
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem(
      "makhan-cart",
      JSON.stringify(existingCart)
    );

    setMessage(
      `${selectedVariant.size} added to cart successfully.`
    );
  }

  function buyNow() {
    if (!product || !selectedVariant) {
      setMessage("Please choose a pack size first.");
      return;
    }

    if (selectedVariant.stock <= 0) {
      setMessage("This pack is currently out of stock.");
      return;
    }

    const cartItem = {
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      size: selectedVariant.size,
      price: selectedVariant.price,
      quantity,
      image: selectedImage || product.image_url || "",
    };

    localStorage.setItem(
      "makhan-cart",
      JSON.stringify([cartItem])
    );

    window.location.href = "/checkout";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9f6] text-[#1c1c1c]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="animate-pulse">
            <div className="h-6 w-32 rounded bg-black/10" />

            <div className="mt-8 grid gap-10 lg:grid-cols-2">
              <div className="h-[600px] rounded-[2rem] bg-[#eee9df]" />

              <div className="space-y-5">
                <div className="h-10 w-3/4 rounded bg-black/10" />
                <div className="h-5 w-full rounded bg-black/10" />
                <div className="h-5 w-2/3 rounded bg-black/10" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 text-[#1c1c1c]">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">
            MAKHAN
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Product unavailable
          </h1>

          <p className="mt-3 text-sm text-black/50">
            {message || "Please check again later."}
          </p>

          <a
            href="/"
            className="mt-7 inline-block rounded-full bg-black px-7 py-3 text-sm text-white"
          >
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  const totalPrice = selectedVariant
    ? selectedVariant.price * quantity
    : 0;

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1c1c1c]">

      {/* Navbar */}
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

          <a
            href="/cart"
            className="rounded-full border border-black px-5 py-2.5 text-sm transition hover:bg-black hover:text-white"
          >
            Cart
          </a>

        </div>
      </header>

      {/* Product */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:py-16">

        {/* Breadcrumb */}
        <div className="mb-10 text-sm text-black/40">
          <a href="/" className="hover:text-black">
            Home
          </a>

          <span className="mx-3">/</span>

          <span className="text-black/70">
            Product
          </span>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">

          {/* IMAGE GALLERY */}
          <div>

            <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#eee9df] p-6 sm:min-h-[600px]">

              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="max-h-[560px] w-full object-contain"
                />
              ) : (
                <div className="text-sm text-black/30">
                  No product image
                </div>
              )}

            </div>

            {images.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-4">

                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() =>
                      setSelectedImage(image.image_url)
                    }
                    className={`relative flex h-28 items-center justify-center overflow-hidden rounded-2xl border bg-[#eee9df] p-2 transition ${
                      selectedImage === image.image_url
                        ? "border-black"
                        : "border-black/10 hover:border-black/40"
                    }`}
                  >

                    <img
                      src={image.image_url}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />

                    {image.is_primary && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-black px-2 py-1 text-[9px] font-semibold text-white">
                        MAIN
                      </span>
                    )}

                  </button>
                ))}

              </div>
            )}

          </div>

          {/* PRODUCT DETAILS */}
          <div className="flex flex-col justify-center">

            <p className="text-xs uppercase tracking-[0.35em] text-black/40">
              Premium Collection
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-6 h-px w-full bg-black/10" />

            <p className="mt-7 max-w-xl text-base leading-8 text-black/60">
              {product.description}
            </p>

            {/* CHOOSE PACK */}
            <div className="mt-10">

              <div className="flex items-center justify-between">

                <p className="text-sm font-medium">
                  Choose your pack
                </p>

                {selectedVariant && (
                  <p className="text-sm text-black/40">
                    {selectedVariant.stock > 0
                      ? `${selectedVariant.stock} available`
                      : "Out of stock"}
                  </p>
                )}

              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

                {variants.map((variant) => {

                  const selected =
                    selectedVariant?.id === variant.id;

                  const outOfStock = variant.stock <= 0;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => selectVariant(variant)}
                      disabled={outOfStock}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-black bg-black text-white shadow-lg"
                          : "border-black/15 bg-white hover:border-black hover:shadow-md"
                      } ${
                        outOfStock
                          ? "cursor-not-allowed opacity-35"
                          : "cursor-pointer"
                      }`}
                    >

                      <p className="text-sm font-medium">
                        {variant.size}
                      </p>

                      <p
                        className={`mt-2 text-sm ${
                          selected
                            ? "text-white/80"
                            : "text-black/50"
                        }`}
                      >
                        ₹{variant.price}
                      </p>

                      {selected && (
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-white/60">
                          Selected ✓
                        </p>
                      )}

                    </button>
                  );
                })}

              </div>

            </div>

            {/* PRICE */}
            {selectedVariant && (
              <div className="mt-8">

                <p className="text-xs uppercase tracking-[0.25em] text-black/40">
                  Price
                </p>

                <div className="mt-2 flex items-baseline gap-2">

                  <span className="text-4xl font-semibold">
                    ₹{selectedVariant.price}
                  </span>

                  <span className="text-sm text-black/40">
                    / {selectedVariant.size}
                  </span>

                </div>

              </div>
            )}

            {/* QUANTITY */}
            {selectedVariant && selectedVariant.stock > 0 && (
              <div className="mt-8">

                <p className="mb-3 text-sm font-medium">
                  Quantity
                </p>

                <div className="flex w-fit items-center rounded-full border border-black/15 bg-white">

                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    className="px-5 py-3 text-lg transition hover:bg-black/5"
                  >
                    −
                  </button>

                  <span className="min-w-10 text-center text-sm">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={quantity >= selectedVariant.stock}
                    className="px-5 py-3 text-lg transition hover:bg-black/5 disabled:opacity-30"
                  >
                    +
                  </button>

                </div>

              </div>
            )}

            {/* TOTAL */}
            {selectedVariant && (
              <div className="mt-8 flex items-end justify-between border-t border-black/10 pt-6">

                <div>

                  <p className="text-xs uppercase tracking-[0.25em] text-black/40">
                    Total
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    ₹{totalPrice}
                  </p>

                </div>

                <p className="text-sm text-black/40">
                  {selectedVariant.size} × {quantity}
                </p>

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
              Buy Now
            </button>

            {message && (
              <p className="mt-4 text-center text-sm text-black/60">
                {message}
              </p>
            )}

            {/* TRUST */}
            <div className="mt-10 grid grid-cols-3 border-y border-black/10 py-6 text-center">

              <div>
                <p className="text-lg">✦</p>

                <p className="mt-2 text-xs text-black/50">
                  Premium Quality
                </p>
              </div>

              <div className="border-x border-black/10">
                <p className="text-lg">❖</p>

                <p className="mt-2 text-xs text-black/50">
                  Carefully Packed
                </p>
              </div>

              <div>
                <p className="text-lg">✓</p>

                <p className="mt-2 text-xs text-black/50">
                  Fresh Product
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

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