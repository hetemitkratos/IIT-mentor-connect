'use client'

import { useState } from 'react'

const loadRazorpay = () => {
  return new Promise<boolean>((resolve) => {
    // If already loaded
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

export default function CompletePaymentButton({ bookingId, sessionToken }: { bookingId: string; sessionToken: string }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true);

      if (
        window.location.hostname !== "candidconversations.in" &&
        window.location.hostname !== "www.candidconversations.in" &&
        window.location.hostname !== "localhost"
      ) {
        alert("Payments are restricted to the candidconversations.in domain.");
        setLoading(false);
        return;
      }

      // Step 1: Load Razorpay SDK
      const isLoaded = await loadRazorpay();

      if (!isLoaded) {
        alert("Failed to load payment gateway");
        setLoading(false);
        return;
      }

      // Step 2: Create order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, sessionToken }),
      });

      const data = await res.json();
      
      if (!res.ok) {
         throw new Error(data.error || "Failed to create order")
      }

      console.log("RAZORPAY DATA:", {
        key: data.key,
        amount: data.amount,
        orderId: data.orderId,
      });

      if (!data.key || !data.amount || !data.orderId) {
        throw new Error("Invalid payment initialization data");
      }

      // Step 3: Configure Razorpay
      const options = {
        key: data.key,
        amount: data.amount,
        currency: "INR",
        order_id: data.orderId,
        handler: async function (response: any) {
          console.log("HANDLER CALLED");
          console.log("PAYMENT RESPONSE:", response);

          try {
            const res = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const data = await res.json();
            console.log("VERIFY RESPONSE:", data);

            if (!res.ok) {
              throw new Error(data.error || "Verification failed");
            }

            window.location.reload();

          } catch (err: any) {
            console.error("[VERIFY_ERROR]", err);
            alert(err.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Payment popup closed");
            setLoading(false); // Make sure button stops loading when dismissed
          },
        },
      };

      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      // Step 4: Open Razorpay
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("[PAYMENT_ERROR]", err)
      alert(err.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-4 text-[15px] font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
          loading
            ? 'bg-[rgba(245,130,10,0.15)] text-[#d96e08] cursor-not-allowed'
            : 'bg-[#f5820a] text-white hover:bg-[#e07509] active:scale-[0.98] shadow-[0_8px_24px_rgba(245,130,10,0.35)]'
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>
            Complete Payment — ₹150
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}
