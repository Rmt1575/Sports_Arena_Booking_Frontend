import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import {
  HiOutlineTicket,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";
import "./Bookings.css";

const Bookings = () => {
  const { user, isAdmin, isManager, isPlayer } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const url = isAdmin || isManager ? "/bookings" : "/bookings/my";
      const res = await API.get(url);
      setBookings(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await API.put(`/bookings/status/${bookingId}`, { status });
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await API.put(`/bookings/cancel/${bookingId}`, {
        reason: "User cancelled",
      });
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handlePayment = async (booking) => {
    try {
      const orderRes = await API.post("/payments/create-order", {
        booking_id: booking._id,
        amount: booking.total_amount,
      });

      const { id: order_id, amount, currency } = orderRes.data.order;
      const key_id = orderRes.data.key_id;

      const options = {
        key: key_id,
        amount,
        currency,
        order_id,
        name: "Kinetic Stadium",
        description: `Booking: ${booking.arena_id?.arena_name || "Arena"}`,
        handler: async (response) => {
          try {
            await API.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: booking._id,
              amount: booking.total_amount,
              payment_method: "Card"
            });
            toast.success("Payment successful!");
            fetchBookings();
          } catch {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#e8612d" },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error("Razorpay not loaded. Add script to index.html");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment initiation failed");
    }
  };

  const filteredBookings =
    filter === "all"
      ? bookings
      : bookings.filter((b) => b.booking_status === filter);

  const getStatusBadge = (s) =>
    ({
      Confirmed: "badge-success",
      Pending: "badge-warning",
      Rejected: "badge-error",
      Cancelled: "badge-error",
    })[s] || "badge-info";

  if (loading) return <LoadingSpinner text="Loading bookings..." />;

  return (
    <div className="bookings-page">
      <div className="bookings-page__header">
        <div>
          <h1 className="bookings-page__title">BOOKINGS</h1>
          <p className="text-muted">{bookings.length} total bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bookings-filters">
        {["all", "Pending", "Confirmed", "Rejected", "Cancelled"].map((f) => (
          <button
            key={f}
            className={`bookings-filter-btn ${filter === f ? "bookings-filter-btn--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f}
            {f !== "all" && (
              <span className="bookings-filter-count">
                {bookings.filter((b) => b.booking_status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredBookings.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {(isAdmin || isManager) && <th>Player</th>}
                <th>Arena</th>
                <th>Slot</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b._id}>
                  {(isAdmin || isManager) && (
                    <td>
                      <div className="booking-user">
                        <div className="booking-user__avatar">
                          {(b.user_id?.name || "U")[0]}
                        </div>
                        <div>
                          <div className="booking-user__name">
                            {b.user_id?.name || "Unknown"}
                          </div>
                          <div className="booking-user__role">
                            {b.user_id?.email || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td style={{ fontWeight: 600 }}>
                    {b.arena_id?.arena_name || "N/A"}
                  </td>
                  <td>
                    {b.slot_id
                      ? `${b.slot_id.start_time}-${b.slot_id.end_time}`
                      : "—"}
                  </td>
                  <td>
                    <span className="badge badge-accent">{b.booking_type}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    ₹{b.total_amount?.toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={`badge ${b.payment_status === "Paid" ? "badge-success" : b.payment_status === "Pending" ? "badge-pending" : "badge-error"}`}
                    >
                      {b.payment_status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${getStatusBadge(b.booking_status)}`}
                    >
                      {b.booking_status}
                    </span>
                  </td>
                  <td>
                    <div className="booking-actions">
                      {(isAdmin || isManager) &&
                        b.booking_status === "Pending" && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              title="Approve"
                              onClick={() =>
                                handleStatusUpdate(b._id, "Confirmed")
                              }
                            >
                              <HiOutlineCheck />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Reject"
                              onClick={() =>
                                handleStatusUpdate(b._id, "Rejected")
                              }
                            >
                              <HiOutlineX />
                            </button>
                          </>
                        )}
                      {isPlayer &&
                        b.booking_status === "Pending" &&
                        b.payment_status === "Pending" && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePayment(b)}
                          >
                            <HiOutlineCurrencyDollar /> Pay
                          </button>
                        )}
                      {isPlayer &&
                        (b.booking_status === "Pending" ||
                          b.booking_status === "Confirmed") && (
                          <button
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleCancel(b._id)}
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bookings-empty card">
          <HiOutlineTicket
            style={{ fontSize: "3rem", color: "var(--text-muted)" }}
          />
          <p className="text-muted" style={{ marginTop: "var(--space-3)" }}>
            No bookings found
          </p>
        </div>
      )}
    </div>
  );
};

export default Bookings;
