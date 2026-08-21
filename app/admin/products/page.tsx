"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
};

type Variant = {
  id: string;
  product_id: string;
  size: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at?: string;
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

  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProduct();
  }, []);

  function showMessage(text: string) {
    setMessage(text);
    setError("");
  }

  function showError(text: string) {
    setError(text);
    setMessage("");
  }

  async function loadProduct() {
    setLoading(true);
    setError("");

    try {
      const { data, error: productError } = await supabase
        .from("products")
        .select(
          "id, name, description, image_url, is_active, created_at"
        )
        .order("created_at", {
          ascending: true,
        })
        .limit(1);

      if (productError) {
        throw new Error(productError.message);
      }

      if (!data || data.length === 0) {
        setProduct(null);
        setVariants([]);
        setImages([]);
        setLoading(false);
        return;
      }

      const currentProduct = data[0] as Product;

      setProduct(currentProduct);
      setName(currentProduct.name);
      setDescription(currentProduct.description ?? "");

      const { data: variantData, error: variantError } =
        await supabase
          .from("product_variants")
          .select(
            "id, product_id, size, price, stock, is_active, created_at"
          )
          .eq("product_id", currentProduct.id)
          .order("created_at", {
            ascending: true,
          });

      if (variantError) {
        throw new Error(variantError.message);
      }

      setVariants((variantData ?? []) as Variant[]);

      const { data: imageData, error: imageError } =
        await supabase
          .from("product_images")
          .select(
            "id, product_id, image_url, storage_path, is_primary, sort_order"
          )
          .eq("product_id", currentProduct.id)
          .order("sort_order", {
            ascending: true,
          });

      if (imageError) {
        throw new Error(imageError.message);
      }

      setImages((imageData ?? []) as ProductImage[]);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the product."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct() {
    const cleanName = name.trim();
    const cleanDescription = description.trim();

    if (!cleanName) {
      showError("Please enter a product name.");
      return;
    }

    setSavingProduct(true);

    try {
      if (product) {
        const { data, error } = await supabase
          .from("products")
          .update({
            name: cleanName,
            description: cleanDescription || null,
          })
          .eq("id", product.id)
          .select(
            "id, name, description, image_url, is_active, created_at"
          )
          .single();

        if (error) {
          throw new Error(error.message);
        }

        setProduct(data as Product);
        setName(data.name);
        setDescription(data.description ?? "");

        showMessage("✓ Product updated successfully.");
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: cleanName,
            description: cleanDescription || null,
            is_active: true,
          })
          .select(
            "id, name, description, image_url, is_active, created_at"
          )
          .single();

        if (error) {
          throw new Error(error.message);
        }

        setProduct(data as Product);
        setName(data.name);
        setDescription(data.description ?? "");

        showMessage("✓ Product created successfully.");
      }
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to save product."
      );
    } finally {
      setSavingProduct(false);
    }
  }

  async function toggleProductStatus() {
    if (!product) return;

    const newStatus = !product.is_active;

    const { error } = await supabase
      .from("products")
      .update({
        is_active: newStatus,
      })
      .eq("id", product.id);

    if (error) {
      showError(error.message);
      return;
    }

    setProduct({
      ...product,
      is_active: newStatus,
    });

    showMessage(
      newStatus
        ? "✓ Product is now active."
        : "✓ Product is now hidden from the website."
    );
  }

  async function uploadImages(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    if (!product) {
      showError("Please save the product first.");
      event.target.value = "";
      return;
    }

    if (files.length === 0) {
      return;
    }

    if (images.length + files.length > 3) {
      showError("Maximum 3 product images are allowed.");
      event.target.value = "";
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        showError("Only image files are allowed.");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showError(
          `"${file.name}" is larger than 5MB. Please choose a smaller image.`
        );
        event.target.value = "";
        return;
      }
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      let nextOrder = images.length;

      for (const file of files) {
        const extension =
          file.name.split(".").pop()?.toLowerCase() || "jpg";

        const uniquePart =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`;

        const fileName = `makhan-${product.id}-${uniquePart}.${extension}`;

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

        const shouldBePrimary =
          images.length === 0 && nextOrder === 0;

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

        if (shouldBePrimary) {
          const { error: productImageError } = await supabase
            .from("products")
            .update({
              image_url: publicUrlData.publicUrl,
            })
            .eq("id", product.id);

          if (productImageError) {
            throw new Error(productImageError.message);
          }
        }

        nextOrder++;
      }

      await loadProduct();
      showMessage("✓ Product images uploaded successfully.");
    } catch (err) {
      showError(
        `Image upload failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function setPrimaryImage(imageId: string) {
    if (!product) return;

    try {
      const { error: resetError } = await supabase
        .from("product_images")
        .update({
          is_primary: false,
        })
        .eq("product_id", product.id);

      if (resetError) {
        throw new Error(resetError.message);
      }

      const { error: primaryError } = await supabase
        .from("product_images")
        .update({
          is_primary: true,
        })
        .eq("id", imageId);

      if (primaryError) {
        throw new Error(primaryError.message);
      }

      const selectedImage = images.find(
        (image) => image.id === imageId
      );

      if (selectedImage) {
        const { error: productError } = await supabase
          .from("products")
          .update({
            image_url: selectedImage.image_url,
          })
          .eq("id", product.id);

        if (productError) {
          throw new Error(productError.message);
        }
      }

      await loadProduct();
      showMessage("✓ Main product image changed.");
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to change main image."
      );
    }
  }

  async function deleteImage(image: ProductImage) {
    if (!product) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this image?"
    );

    if (!confirmed) return;

    try {
      const { error: deleteDbError } = await supabase
        .from("product_images")
        .delete()
        .eq("id", image.id);

      if (deleteDbError) {
        throw new Error(deleteDbError.message);
      }

      await supabase.storage
        .from("product-images")
        .remove([image.storage_path]);

      const remaining = images.filter(
        (item) => item.id !== image.id
      );

      if (image.is_primary) {
        if (remaining.length > 0) {
          const nextPrimary = remaining[0];

          await supabase
            .from("product_images")
            .update({
              is_primary: false,
            })
            .eq("product_id", product.id);

          await supabase
            .from("product_images")
            .update({
              is_primary: true,
            })
            .eq("id", nextPrimary.id);

          await supabase
            .from("products")
            .update({
              image_url: nextPrimary.image_url,
            })
            .eq("id", product.id);
        } else {
          await supabase
            .from("products")
            .update({
              image_url: null,
            })
            .eq("id", product.id);
        }
      }

      await loadProduct();
      showMessage("✓ Image removed.");
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to remove image."
      );
    }
  }

  async function addVariant() {
    if (!product) {
      showError("Please save the product first.");
      return;
    }

    const cleanSize = size.trim();
    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!cleanSize) {
      showError("Please enter a pack size.");
      return;
    }

    if (
      price === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      showError("Please enter a valid price.");
      return;
    }

    if (
      stock === "" ||
      !Number.isFinite(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericStock)
    ) {
      showError("Stock must be a valid whole number.");
      return;
    }

    const duplicate = variants.some(
      (variant) =>
        variant.size.trim().toLowerCase() ===
        cleanSize.toLowerCase()
    );

    if (duplicate) {
      showError("This pack size already exists.");
      return;
    }

    setAddingVariant(true);

    try {
      const { error } = await supabase
        .from("product_variants")
        .insert({
          product_id: product.id,
          size: cleanSize,
          price: numericPrice,
          stock: numericStock,
          is_active: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      setSize("");
      setPrice("");
      setStock("");

      await loadProduct();
      showMessage("✓ Pack size added successfully.");
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to add pack size."
      );
    } finally {
      setAddingVariant(false);
    }
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
      showError(error.message);
      return;
    }

    await loadProduct();
    showMessage("✓ Pack size deleted.");
  }

  async function updateVariantStock(
    id: string,
    newStock: number
  ) {
    if (!Number.isInteger(newStock) || newStock < 0) {
      showError("Stock must be a valid whole number.");
      return;
    }

    const { error } = await supabase
      .from("product_variants")
      .update({
        stock: newStock,
      })
      .eq("id", id);

    if (error) {
      showError(error.message);
      return;
    }

    setVariants((current) =>
      current.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              stock: newStock,
            }
          : variant
      )
    );

    showMessage("✓ Stock updated.");
  }

  async function toggleVariantStatus(variant: Variant) {
    const { error } = await supabase
      .from("product_variants")
      .update({
        is_active: !variant.is_active,
      })
      .eq("id", variant.id);

    if (error) {
      showError(error.message);
      return;
    }

    setVariants((current) =>
      current.map((item) =>
        item.id === variant.id
          ? {
              ...item,
              is_active: !item.is_active,
            }
          : item
      )
    );

    showMessage(
      variant.is_active
        ? "✓ Pack size hidden."
        : "✓ Pack size activated."
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0d0c] px-6 text-white">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#d8bd73]">
            MAKHAN
          </p>

          <p className="mt-4 text-sm text-white/40">
            Loading product management...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0c] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#d8bd73]">
              Admin Panel
            </p>

            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Products
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Manage your Makhan product, images, pack sizes,
              prices and stock.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              (window.location.href = "/admin/dashboard")
            }
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
          >
            ← Dashboard
          </button>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mt-6 rounded-2xl border border-[#d8bd73]/20 bg-[#d8bd73]/10 px-5 py-4 text-sm text-[#e8d69d]">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* PRODUCT INFORMATION */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                Product Information
              </p>

              <h2 className="mt-2 text-2xl font-medium">
                Product Details
              </h2>
            </div>

            {product && (
              <button
                type="button"
                onClick={toggleProductStatus}
                className={`rounded-full px-4 py-2 text-xs font-medium ${
                  product.is_active
                    ? "bg-green-400/10 text-green-300"
                    : "bg-red-400/10 text-red-300"
                }`}
              >
                {product.is_active
                  ? "● Active"
                  : "● Hidden"}
              </button>
            )}
          </div>

          <div className="mt-7">
            <label className="mb-2 block text-sm text-white/60">
              Product Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Premium Traditional Makhan"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none transition focus:border-[#d8bd73]/50"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm text-white/60">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your product..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none transition focus:border-[#d8bd73]/50"
            />
          </div>

          <button
            type="button"
            onClick={saveProduct}
            disabled={savingProduct}
            className="mt-6 rounded-full bg-gradient-to-r from-[#c7a95c] to-[#f0d98f] px-8 py-3 text-sm font-semibold text-[#17150f] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingProduct
              ? "Saving..."
              : product
              ? "Save Changes"
              : "Create Product"}
          </button>
        </section>

        {/* PRODUCT GALLERY */}
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
                Upload up to 3 high-quality product images.
              </p>
            </div>

            <div className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/50">
              {images.length} / 3 images
            </div>
          </div>

          {!product ? (
            <div className="mt-7 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/30">
              Save the product first, then upload images.
            </div>
          ) : (
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
                        alt={product.name}
                        className="h-full w-full object-contain"
                      />

                      {image.is_primary && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#d8bd73] px-3 py-1 text-[10px] font-semibold text-[#17150f]">
                          ⭐ MAIN IMAGE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-white/10 p-4">

                      {!image.is_primary ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPrimaryImage(image.id)
                          }
                          className="rounded-full border border-[#d8bd73]/30 px-3 py-2 text-xs text-[#e8d69d] transition hover:bg-[#d8bd73]/10"
                        >
                          Make Main
                        </button>
                      ) : (
                        <span className="text-xs text-white/30">
                          Main image
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteImage(image)}
                        className="rounded-full border border-red-400/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-400/10"
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
                      Add Product Image
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
            Pricing & Inventory
          </p>

          <h2 className="mt-2 text-2xl font-medium">
            Pack Sizes
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Add pack sizes, prices and available stock.
          </p>

          {!product ? (
            <div className="mt-7 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
              Save the product first, then add pack sizes.
            </div>
          ) : (
            <>
              <div className="mt-7 grid gap-4 md:grid-cols-3">

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Pack Size
                  </label>

                  <input
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="250g"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none transition focus:border-[#d8bd73]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="169"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none transition focus:border-[#d8bd73]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="20"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none transition focus:border-[#d8bd73]/50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addVariant}
                disabled={addingVariant}
                className="mt-6 rounded-full border border-[#d8bd73]/40 px-7 py-3 text-sm font-medium text-[#e8d69d] transition hover:bg-[#d8bd73] hover:text-[#17150f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingVariant
                  ? "Adding..."
                  : "+ Add Pack Size"}
              </button>

              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">

                  <thead>
                    <tr className="border-b border-white/10 text-xs text-white/30">
                      <th className="px-4 py-4">
                        Size
                      </th>

                      <th className="px-4 py-4">
                        Price
                      </th>

                      <th className="px-4 py-4">
                        Stock
                      </th>

                      <th className="px-4 py-4">
                        Status
                      </th>

                      <th className="px-4 py-4 text-right">
                        Action
                      </th>
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
                          ₹{Number(variant.price)}
                        </td>

                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={variant.stock}
                            onChange={(e) => {
                              const value = Number(
                                e.target.value
                              );

                              setVariants((current) =>
                                current.map((item) =>
                                  item.id === variant.id
                                    ? {
                                        ...item,
                                        stock: Number.isFinite(
                                          value
                                        )
                                          ? value
                                          : 0,
                                      }
                                    : item
                                )
                              );
                            }}
                            onBlur={() =>
                              updateVariantStock(
                                variant.id,
                                variant.stock
                              )
                            }
                            className="w-24 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm outline-none focus:border-[#d8bd73]/50"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              toggleVariantStatus(variant)
                            }
                            className={`rounded-full px-3 py-1 text-xs ${
                              variant.is_active
                                ? "bg-green-400/10 text-green-300"
                                : "bg-red-400/10 text-red-300"
                            }`}
                          >
                            {variant.is_active
                              ? "Active"
                              : "Hidden"}
                          </button>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              deleteVariant(variant.id)
                            }
                            className="text-xs text-red-300 transition hover:text-red-200"
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
            </>
          )}
        </section>

        {/* QUICK SUMMARY */}
        <section className="mt-8 grid gap-4 pb-10 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Product
            </p>

            <p className="mt-3 text-lg font-medium">
              {product ? "1 product" : "Not created"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Pack Sizes
            </p>

            <p className="mt-3 text-lg font-medium">
              {variants.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Product Images
            </p>

            <p className="mt-3 text-lg font-medium">
              {images.length} / 3
            </p>
          </div>

        </section>

      </div>
    </main>
  );
}