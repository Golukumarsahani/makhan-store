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

type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
};

export default function ProductsPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  const [name, setName] = useState("Premium Traditional Makhan");
  const [description, setDescription] = useState(
    "Rich, creamy and traditionally inspired makhan."
  );

  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProduct();
  }, []);

  async function loadProduct() {
    setMessage("");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) {
      setMessage(`Product load error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setProduct(null);
      setVariants([]);
      setImages([]);
      return;
    }

    const currentProduct = data[0];

    setProduct(currentProduct);
    setName(currentProduct.name);
    setDescription(currentProduct.description ?? "");

    const { data: variantData, error: variantError } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", currentProduct.id)
      .order("created_at", { ascending: true });

    if (variantError) {
      setMessage(`Pack load error: ${variantError.message}`);
      return;
    }

    setVariants(variantData ?? []);

    const { data: imageData, error: imageError } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", currentProduct.id)
      .order("sort_order", { ascending: true });

    if (imageError) {
      setMessage(`Image load error: ${imageError.message}`);
      return;
    }

    setImages(imageData ?? []);
  }

  async function saveProduct() {
    if (!name.trim()) {
      setMessage("Please enter a product name.");
      return;
    }

    setLoading(true);
    setMessage("");

    if (product) {
      const { data, error } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          description: description.trim(),
        })
        .eq("id", product.id)
        .select()
        .single();

      if (error) {
        setMessage(`Save failed: ${error.message}`);
        setLoading(false);
        return;
      }

      setProduct(data);
      setName(data.name);
      setDescription(data.description ?? "");
      setMessage("✓ Product updated successfully.");
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          description: description.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        setMessage(`Create failed: ${error.message}`);
        setLoading(false);
        return;
      }

      setProduct(data);
      setMessage("✓ Product created successfully.");
    }

    setLoading(false);
  }

  async function uploadImages(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    if (!product) {
      setMessage("Please save the product first.");
      return;
    }

    if (files.length === 0) return;

    if (images.length + files.length > 3) {
      setMessage("Maximum 3 product images are allowed.");
      event.target.value = "";
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setMessage("Only image files are allowed.");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage("Each image must be smaller than 5MB.");
        event.target.value = "";
        return;
      }
    }

    setUploading(true);
    setMessage("");

    try {
      let nextOrder = images.length;

      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName = `makhan-${product.id}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        const storagePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(storagePath);

        const shouldBePrimary = images.length === 0 && nextOrder === 0;

        const { error: insertError } = await supabase
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: publicUrlData.publicUrl,
            storage_path: storagePath,
            is_primary: shouldBePrimary,
            sort_order: nextOrder,
          });

        if (insertError) {
          await supabase.storage
            .from("product-images")
            .remove([storagePath]);

          throw new Error(insertError.message);
        }

        nextOrder++;
      }

      await loadProduct();
      setMessage("✓ Product images uploaded successfully.");
    } catch (error) {
      setMessage(
        `Image upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function setPrimaryImage(imageId: string) {
    if (!product) return;

    const { error: resetError } = await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", product.id);

    if (resetError) {
      setMessage(resetError.message);
      return;
    }

    const { error } = await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", imageId);

    if (error) {
      setMessage(error.message);
      return;
    }

    const selectedImage = images.find((image) => image.id === imageId);

    if (selectedImage) {
      await supabase
        .from("products")
        .update({ image_url: selectedImage.image_url })
        .eq("id", product.id);
    }

    await loadProduct();
    setMessage("✓ Main product image changed.");
  }

  async function deleteImage(image: ProductImage) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this image?"
    );

    if (!confirmed) return;

    const { error: deleteDbError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id);

    if (deleteDbError) {
      setMessage(deleteDbError.message);
      return;
    }

    await supabase.storage
      .from("product-images")
      .remove([image.storage_path]);

    if (image.is_primary && product) {
      const remaining = images.filter((item) => item.id !== image.id);

      if (remaining.length > 0) {
        await setPrimaryImage(remaining[0].id);
      } else {
        await supabase
          .from("products")
          .update({ image_url: null })
          .eq("id", product.id);
      }
    }

    await loadProduct();
    setMessage("✓ Image removed.");
  }

  async function addVariant() {
    if (!product) {
      setMessage("Please save the product first.");
      return;
    }

    if (!size.trim() || !price || !stock) {
      setMessage("Please enter pack size, price and stock.");
      return;
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (numericPrice < 0 || numericStock < 0) {
      setMessage("Price and stock cannot be negative.");
      return;
    }

    const { error } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        size: size.trim(),
        price: numericPrice,
        stock: numericStock,
        is_active: true,
      });

    if (error) {
      setMessage(`Pack save failed: ${error.message}`);
      return;
    }

    setSize("");
    setPrice("");
    setStock("");

    await loadProduct();
    setMessage("✓ Pack size added.");
  }

  async function deleteVariant(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this pack size?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadProduct();
    setMessage("✓ Pack size deleted.");
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
              Product Listing
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Create and manage your premium Makhan product.
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "/admin/dashboard")}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
          >
            ← Dashboard
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mt-6 rounded-2xl border border-[#d8bd73]/20 bg-[#d8bd73]/10 px-5 py-4 text-sm text-[#e8d69d]">
            {message}
          </div>
        )}

        {/* BASIC PRODUCT INFO */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-white/30">
            Product Information
          </p>

          <h2 className="mt-2 text-2xl font-medium">
            Product Details
          </h2>

          <div className="mt-7 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white/60">
                Product Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: Premium Makhan"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Product Status
              </label>

              <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm">
                <span className="text-[#d8bd73]">
                  {product ? "● Active" : "Not saved yet"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm text-white/60">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your Makhan..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
            />
          </div>

          <button
            onClick={saveProduct}
            disabled={loading}
            className="mt-6 rounded-full bg-gradient-to-r from-[#c7a95c] to-[#f0d98f] px-8 py-3 text-sm font-semibold text-[#17150f] disabled:opacity-50"
          >
            {loading ? "Saving..." : product ? "Save Changes" : "Create Product"}
          </button>
        </section>

        {/* IMAGES */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                Product Gallery
              </p>

              <h2 className="mt-2 text-2xl font-medium">
                Product Images
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Add up to 3 high-quality product images.
              </p>
            </div>

            <div className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/50">
              {images.length} / 3 images
            </div>
          </div>

          {!product && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
              Save the product first, then upload images.
            </div>
          )}

          {product && (
            <>
              <div className="mt-7 grid gap-5 md:grid-cols-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  >
                    <div className="relative flex h-64 items-center justify-center bg-white/[0.03] p-4">
                      <img
                        src={image.image_url}
                        alt="Makhan product"
                        className="h-full w-full object-contain"
                      />

                      {image.is_primary && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#d8bd73] px-3 py-1 text-[11px] font-semibold text-[#17150f]">
                          ⭐ MAIN IMAGE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-white/10 p-4">
                      {!image.is_primary ? (
                        <button
                          onClick={() => setPrimaryImage(image.id)}
                          className="rounded-full border border-[#d8bd73]/30 px-3 py-2 text-xs text-[#e8d69d] hover:bg-[#d8bd73]/10"
                        >
                          Make Main
                        </button>
                      ) : (
                        <span className="text-xs text-white/30">
                          Main image
                        </span>
                      )}

                      <button
                        onClick={() => deleteImage(image)}
                        className="rounded-full border border-red-400/20 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < 3 && (
                  <label className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-center transition hover:border-[#d8bd73]/40 hover:bg-white/[0.04]">
                    <span className="text-4xl text-[#d8bd73]">
                      +
                    </span>

                    <span className="mt-4 text-sm font-medium">
                      Add Product Images
                    </span>

                    <span className="mt-2 px-6 text-xs leading-5 text-white/30">
                      JPG, PNG or WebP
                      <br />
                      Maximum 5MB per image
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={uploadImages}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {uploading && (
                <div className="mt-5 rounded-xl bg-[#d8bd73]/10 px-4 py-3 text-sm text-[#e8d69d]">
                  Uploading images...
                </div>
              )}
            </>
          )}
        </section>

        {/* PACK SIZES */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
            Pricing
          </p>

          <h2 className="mt-2 text-2xl font-medium">
            Pack Sizes
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Add different quantities of Makhan with their own prices.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-white/60">
                Pack Size
              </label>

              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="250g"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Price
              </label>

              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₹"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Stock
              </label>

              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Quantity"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none focus:border-[#d8bd73]/50"
              />
            </div>
          </div>

          <button
            onClick={addVariant}
            className="mt-6 rounded-full border border-[#d8bd73]/40 px-7 py-3 text-sm font-medium text-[#e8d69d] transition hover:bg-[#d8bd73] hover:text-[#17150f]"
          >
            + Add Pack Size
          </button>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs text-white/30">
                  <th className="px-4 py-4">Size</th>
                  <th className="px-4 py-4">Price</th>
                  <th className="px-4 py-4">Stock</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {variants.map((variant) => (
                  <tr
                    key={variant.id}
                    className="border-b border-white/5"
                  >
                    <td className="px-4 py-4 text-sm font-medium">
                      {variant.size}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      ₹{variant.price}
                    </td>

                    <td className="px-4 py-4 text-sm text-white/60">
                      {variant.stock}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-green-400/10 px-3 py-1 text-xs text-green-300">
                        Active
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => deleteVariant(variant.id)}
                        className="text-xs text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {variants.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-white/30"
                    >
                      No pack sizes added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}