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
    <div className="mt-4 flex flex-col items-start gap-2">
      <p className="text-sm font-medium text-orange-600">Complete payment to confirm your session</p>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Complete Payment'}
      </button>
    </div>
  )
}
