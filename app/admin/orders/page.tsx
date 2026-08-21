"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  order_number?: string | null;

  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_mobile?: string | null;

  customer_state?: string | null;
  customer_city?: string | null;
  customer_address?: string | null;
  customer_pincode?: string | null;

  payment_method?: string | null;
  payment_status?: string | null;

  subtotal?: number | null;
  delivery_charge?: number | null;
  delivery?: number | null;
  total?: number | null;

  status?: string | null;

  invoice_number?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

type OrderItem = {
  id: string;
  order_id: string;

  product_id?: string | null;
  product_name?: string | null;

  variant_id?: string | null;
  size?: string | null;

  price?: number | null;
  quantity?: number | null;

  image_url?: string | null;
  image_ur1?: string | null;

  created_at?: string | null;
};

type StatusHistory = {
  id: string;
  order_id: string;
  status?: string | null;
  note?: string | null;
  created_at?: string | null;
};

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    color: "bg-blue-400/10 text-blue-300 border-blue-400/20",
  },
  {
    value: "processing",
    label: "Processing",
    color: "bg-purple-400/10 text-purple-300 border-purple-400/20",
  },
  {
    value: "shipped",
    label: "Shipped",
    color: "bg-indigo-400/10 text-indigo-300 border-indigo-400/20",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    color: "bg-orange-400/10 text-orange-300 border-orange-400/20",
  },
  {
    value: "delivered",
    label: "Delivered",
    color: "bg-green-400/10 text-green-300 border-green-400/20",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-red-400/10 text-red-300 border-red-400/20",
  },
];

function getStatusInfo(status?: string | null) {
  const found = STATUS_OPTIONS.find(
    (item) => item.value === status
  );

  return (
    found ?? {
      value: status ?? "unknown",
      label: status
        ? status
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) =>
              letter.toUpperCase()
            )
        : "Unknown",
      color:
        "bg-white/10 text-white/60 border-white/10",
    }
  );
}

function formatMoney(value?: number | null) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] =
    useState(false);
  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  function showMessage(text: string) {
    setMessage(text);
    setError("");
  }

  function showError(text: string) {
    setError(text);
    setMessage("");
  }

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const { data, error: ordersError } =
        await supabase
          .from("orders")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (ordersError) {
        throw new Error(ordersError.message);
      }

      setOrders((data ?? []) as Order[]);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openOrder(order: Order) {
    setSelectedOrder(order);
    setItems([]);
    setHistory([]);
    setLoadingDetails(true);
    setError("");

    try {
      const { data: itemData, error: itemsError } =
        await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id)
          .order("created_at", {
            ascending: true,
          });

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      setItems((itemData ?? []) as OrderItem[]);

      const { data: historyData, error: historyError } =
        await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", order.id)
          .order("created_at", {
            ascending: false,
          });

      if (!historyError) {
        setHistory(
          (historyData ?? []) as StatusHistory[]
        );
      }
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to load order details."
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  async function updateOrderStatus(
    order: Order,
    newStatus: string
  ) {
    if (!newStatus || newStatus === order.status) {
      return;
    }

    setUpdatingStatus(true);
    setError("");
    setMessage("");

    try {
      const { error: updateError } =
        await supabase
          .from("orders")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      /*
       * Add status history.
       *
       * If your order_status_history table has different
       * columns, this insert is skipped instead of breaking
       * the main order status update.
       */

      await supabase
        .from("order_status_history")
        .insert({
          order_id: order.id,
          status: newStatus,
        });

      const updatedOrder = {
        ...order,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? updatedOrder
            : item
        )
      );

      setSelectedOrder(updatedOrder);

      const { data: newHistory } =
        await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", order.id)
          .order("created_at", {
            ascending: false,
          });

      setHistory(
        (newHistory ?? []) as StatusHistory[]
      );

      showMessage(
        `Order ${order.order_number ?? order.id} marked as ${getStatusInfo(newStatus).label}.`
      );
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        order.order_number,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.customer_mobile,
        order.customer_city,
        order.customer_pincode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [orders, search, statusFilter]);

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "pending" ||
      order.status === "pending_payment"
  ).length;

  const processingOrders = orders.filter((order) =>
    [
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
    ].includes(order.status ?? "")
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  const revenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce(
      (sum, order) => sum + Number(order.total ?? 0),
      0
    );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0d0c] text-white">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#d8bd73]">
            MAKHAN
          </p>

          <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#d8bd73]" />

          <p className="mt-4 text-sm text-white/40">
            Loading orders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0c] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#d8bd73]">
              Admin Panel
            </p>

            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Orders
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Manage customer orders, payment status,
              delivery status and order details.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadOrders}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                (window.location.href =
                  "/admin/dashboard")
              }
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/10"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* MESSAGE */}

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

        {/* STATS */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Orders"
            value={String(totalOrders)}
          />

          <StatCard
            title="Pending"
            value={String(pendingOrders)}
          />

          <StatCard
            title="Processing"
            value={String(processingOrders)}
          />

          <StatCard
            title="Delivered"
            value={String(deliveredOrders)}
          />

          <StatCard
            title="Revenue"
            value={formatMoney(revenue)}
          />
        </section>

        {/* FILTERS */}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/30">
                Search Orders
              </label>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Order number, customer, email, mobile..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-[#d8bd73]/50"
              />
            </div>

            <div className="lg:w-64">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/30">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#171715] px-4 py-3 text-sm outline-none focus:border-[#d8bd73]/50"
              >
                <option value="all">
                  All Orders
                </option>

                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}

                <option value="pending_payment">
                  Pending Payment
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* ORDERS */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                Orders
              </p>

              <h2 className="mt-2 text-xl font-medium">
                {filteredOrders.length}{" "}
                {filteredOrders.length === 1
                  ? "Order"
                  : "Orders"}
              </h2>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl">
                📦
              </div>

              <h3 className="mt-5 text-lg font-medium">
                No orders found
              </h3>

              <p className="mt-2 text-sm text-white/35">
                Orders matching your filters will appear
                here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.15em] text-white/30">
                    <th className="px-6 py-4">
                      Order
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4">
                      Payment
                    </th>

                    <th className="px-6 py-4">
                      Total
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const status = getStatusInfo(
                      order.status
                    );

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.025]"
                      >
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold">
                            #
                            {order.order_number ??
                              order.id.slice(0, 8)}
                          </p>

                          <p className="mt-1 text-xs text-white/30">
                            ID: {order.id.slice(0, 8)}...
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium">
                            {order.customer_name ??
                              "Customer"}
                          </p>

                          <p className="mt-1 text-xs text-white/35">
                            {order.customer_email ??
                              "No email"}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-sm text-white/50">
                          {formatDate(order.created_at)}
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm">
                            {order.payment_method ??
                              "Online Payment"}
                          </p>

                          <p className="mt-1 text-xs capitalize text-white/35">
                            {(order.payment_status ??
                              "pending").replaceAll(
                              "_",
                              " "
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-sm font-semibold">
                          {formatMoney(order.total)}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openOrder(order)
                            }
                            className="rounded-full border border-[#d8bd73]/30 px-4 py-2 text-xs text-[#e8d69d] transition hover:bg-[#d8bd73]/10"
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ORDER DETAILS MODAL */}

        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-8">
            <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#151513] shadow-2xl">

              {/* MODAL HEADER */}

              <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-white/10 bg-[#151513] px-5 py-5 sm:px-7">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd73]">
                    Order Details
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    #
                    {selectedOrder.order_number ??
                      selectedOrder.id.slice(0, 8)}
                  </h2>

                  <p className="mt-1 text-xs text-white/35">
                    {formatDate(
                      selectedOrder.created_at
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrder(null)
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#d8bd73]" />

                    <p className="mt-4 text-sm text-white/40">
                      Loading order...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 p-5 sm:p-7">

                  {/* STATUS */}

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                          Order Status
                        </p>

                        <p className="mt-2 text-lg font-medium">
                          {getStatusInfo(
                            selectedOrder.status
                          ).label}
                        </p>
                      </div>

                      <select
                        value={
                          selectedOrder.status ??
                          "pending"
                        }
                        disabled={updatingStatus}
                        onChange={(e) =>
                          updateOrderStatus(
                            selectedOrder,
                            e.target.value
                          )
                        }
                        className="rounded-xl border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm outline-none focus:border-[#d8bd73]/50 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map(
                          (status) => (
                            <option
                              key={status.value}
                              value={status.value}
                            >
                              {status.label}
                            </option>
                          )
                        )}

                        <option value="pending_payment">
                          Pending Payment
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* CUSTOMER + PAYMENT */}

                  <div className="grid gap-6 lg:grid-cols-2">

                    <InfoCard title="Customer Details">
                      <InfoRow
                        label="Name"
                        value={
                          selectedOrder.customer_name
                        }
                      />

                      <InfoRow
                        label="Email"
                        value={
                          selectedOrder.customer_email
                        }
                      />

                      <InfoRow
                        label="Mobile"
                        value={
                          selectedOrder.customer_phone ??
                          selectedOrder.customer_mobile
                        }
                      />
                    </InfoCard>

                    <InfoCard title="Payment">
                      <InfoRow
                        label="Method"
                        value={
                          selectedOrder.payment_method ??
                          "Online Payment"
                        }
                      />

                      <InfoRow
                        label="Payment Status"
                        value={
                          selectedOrder.payment_status ??
                          "Pending"
                        }
                      />

                      <InfoRow
                        label="Invoice"
                        value={
                          selectedOrder.invoice_number ??
                          "Not generated"
                        }
                      />
                    </InfoCard>

                  </div>

                  {/* ADDRESS */}

                  <InfoCard title="Delivery Address">
                    <div className="rounded-xl bg-black/20 p-4 text-sm leading-7 text-white/60">
                      {selectedOrder.customer_address ??
                        "Address not available"}

                      <br />

                      {[
                        selectedOrder.customer_city,
                        selectedOrder.customer_state,
                        selectedOrder.customer_pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </InfoCard>

                  {/* ITEMS */}

                  <InfoCard title="Order Items">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-white/30">
                        No order items found.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item) => {
                          const image =
                            item.image_url ??
                            item.image_ur1 ??
                            null;

                          return (
                            <div
                              key={item.id}
                              className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                            >
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={
                                      item.product_name ??
                                      "Product"
                                    }
                                    className="h-full w-full object-contain p-2"
                                  />
                                ) : (
                                  <span className="text-[9px] text-white/30">
                                    MAKHAN
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {item.product_name ??
                                    "Product"}
                                </p>

                                <p className="mt-1 text-xs text-white/35">
                                  Pack:{" "}
                                  {item.size ?? "—"}
                                </p>

                                <p className="mt-1 text-xs text-white/35">
                                  Quantity:{" "}
                                  {item.quantity ?? 0}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-semibold">
                                  {formatMoney(
                                    Number(
                                      item.price ?? 0
                                    ) *
                                      Number(
                                        item.quantity ?? 0
                                      )
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-white/30">
                                  ₹
                                  {Number(
                                    item.price ?? 0
                                  )}{" "}
                                  each
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </InfoCard>

                  {/* TOTAL */}

                  <div className="rounded-2xl border border-[#d8bd73]/20 bg-[#d8bd73]/5 p-5">
                    <div className="ml-auto max-w-sm space-y-3">
                      <div className="flex justify-between text-sm text-white/50">
                        <span>Subtotal</span>

                        <span>
                          {formatMoney(
                            selectedOrder.subtotal
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-white/50">
                        <span>Delivery</span>

                        <span>
                          {Number(
                            selectedOrder.delivery_charge ??
                              selectedOrder.delivery ??
                              0
                          ) === 0
                            ? "FREE"
                            : formatMoney(
                                selectedOrder.delivery_charge ??
                                  selectedOrder.delivery
                              )}
                        </span>
                      </div>

                      <div className="flex justify-between border-t border-white/10 pt-4">
                        <span className="text-sm font-medium">
                          Total
                        </span>

                        <span className="text-2xl font-semibold text-[#e8d69d]">
                          {formatMoney(
                            selectedOrder.total
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HISTORY */}

                  <InfoCard title="Order Status History">
                    {history.length === 0 ? (
                      <p className="text-sm text-white/30">
                        No status history available.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {history.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex gap-4"
                          >
                            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d8bd73]" />

                            <div>
                              <p className="text-sm font-medium">
                                {getStatusInfo(
                                  entry.status
                                ).label}
                              </p>

                              <p className="mt-1 text-xs text-white/30">
                                {formatDate(
                                  entry.created_at
                                )}
                              </p>

                              {entry.note && (
                                <p className="mt-2 text-xs text-white/45">
                                  {entry.note}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </InfoCard>

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* -------------------------------------------------------
   SMALL UI COMPONENTS
------------------------------------------------------- */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/30">
        {title}
      </p>

      <p className="mt-3 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-5 text-xs uppercase tracking-[0.2em] text-[#d8bd73]">
        {title}
      </p>

      {children}
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-5 border-b border-white/5 py-3 last:border-b-0">
      <span className="text-sm text-white/30">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-sm text-white/70">
        {value || "—"}
      </span>
    </div>
  );
}