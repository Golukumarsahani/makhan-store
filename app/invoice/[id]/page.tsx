"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal?: number | null;
  shipping_charge?: number | null;
  total_amount: number;
  payment_status: string | null;
  payment_method?: string | null;
  created_at: string;
};

type Item = {
  id: string;
  product_name: string;
  size: string;
  price: number;
  quantity: number;
};

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { id } = await params;

      const { data, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError) {
        setError(orderError.message);
        setLoading(false);
        return;
      }

      const { data: itemData, error: itemError } =
        await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", id);

      if (itemError) {
        setError(itemError.message);
        setLoading(false);
        return;
      }

      setOrder(data as Order);
      setItems((itemData ?? []) as Item[]);
      setLoading(false);
    }

    load();
  }, [params]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p>Loading invoice...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            Invoice unavailable
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {error || "Order not found."}
          </p>
        </div>
      </main>
    );
  }

  const subtotal =
    order.subtotal ??
    items.reduce(
      (sum, item) =>
        sum + Number(item.price) * Number(item.quantity),
      0
    );

  const shipping = Number(order.shipping_charge || 0);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">

      <div className="mx-auto max-w-3xl">

        <div className="mb-5 flex justify-end gap-3 print:hidden">

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Download / Print Invoice
          </button>

          <button
            onClick={() => window.close()}
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm"
          >
            Close
          </button>

        </div>

        <div className="bg-white p-8 shadow-sm sm:p-12">

          <div className="flex flex-col justify-between gap-6 border-b border-gray-200 pb-8 sm:flex-row">

            <div>
              <h1 className="text-3xl font-bold">
                AG Power Plus
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                INVOICE
              </p>
            </div>

            <div className="text-left sm:text-right">

              <p className="text-sm text-gray-500">
                Invoice / Order
              </p>

              <p className="mt-1 font-mono font-semibold">
                {order.order_number || order.id}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {new Date(
                  order.created_at
                ).toLocaleDateString("en-IN")}
              </p>

            </div>

          </div>

          <div className="grid gap-8 border-b border-gray-200 py-8 sm:grid-cols-2">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Bill To
              </p>

              <p className="mt-3 font-semibold">
                {order.customer_name}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {order.customer_phone}
              </p>

              {order.customer_email && (
                <p className="mt-1 text-sm text-gray-600">
                  {order.customer_email}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Delivery Address
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                {order.address}
                <br />
                {order.city}, {order.state}
                <br />
                PIN: {order.pincode}
              </p>
            </div>

          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">

            <table className="w-full text-left">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-4">
                    Item
                  </th>

                  <th className="px-4 py-4">
                    Pack
                  </th>

                  <th className="px-4 py-4">
                    Qty
                  </th>

                  <th className="px-4 py-4 text-right">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>

                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-200"
                  >
                    <td className="px-4 py-4 text-sm font-medium">
                      {item.product_name}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {item.size}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-4 text-right text-sm">
                      ₹
                      {Number(item.price) *
                        Number(item.quantity)}
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          <div className="ml-auto mt-8 max-w-sm space-y-3">

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span>
                ₹{subtotal}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Shipping
              </span>

              <span>
                ₹{shipping}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-4 text-xl font-bold">
              <span>Total</span>

              <span>
                ₹{Number(order.total_amount)}
              </span>
            </div>

          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-500">

            <p>
              Payment:{" "}
              {(order.payment_method || "COD").toUpperCase()}
            </p>

            <p className="mt-1">
              Payment Status:{" "}
              {(order.payment_status || "pending").toUpperCase()}
            </p>

            <p className="mt-6 text-center">
              Thank you for your order.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}