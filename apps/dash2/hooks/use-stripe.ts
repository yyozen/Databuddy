// import { useState } from "react";
// import { toast } from "sonner";
// import getStripe from "@/lib/stripe";

// interface UseStripeProps {
//   userId: string;
//   user: {
//     email: string;
//     name: string;
//   };
// }

// export function useStripe({ userId, user }: UseStripeProps) {
//   const [isLoading, setIsLoading] = useState(false);

//   const createCheckoutSession = async (priceId: string) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch("/api/stripe/checkout", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           priceId,
//           userId,
//           user: {
//             email: user.email,
//             name: user.name,
//           },
//         }),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.error || "Failed to create checkout session");
//       }

//       const { sessionId } = await response.json();

//       if (!sessionId) {
//         throw new Error("No session ID returned");
//       }

//       const stripe = await getStripe();
//       if (!stripe) {
//         throw new Error("Stripe failed to load");
//       }

//       const { error } = await stripe.redirectToCheckout({
//         sessionId,
//       });

//       if (error) {
//         throw error;
//       }
//     } catch (error) {
//       console.error("Error creating checkout session:", error);
//       toast.error("Failed to start checkout process");
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const cancelSubscription = async (subscriptionId: string) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch("/api/stripe/subscription", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           subscriptionId,
//           action: "cancel",
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to cancel subscription");
//       }

//       toast.success("Subscription cancelled successfully");
//     } catch (error) {
//       console.error("Error cancelling subscription:", error);
//       toast.error("Failed to cancel subscription");
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const resumeSubscription = async (subscriptionId: string) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch("/api/stripe/subscription", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           subscriptionId,
//           action: "resume",
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to resume subscription");
//       }

//       toast.success("Subscription resumed successfully");
//     } catch (error) {
//       console.error("Error resuming subscription:", error);
//       toast.error("Failed to resume subscription");
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const updateSubscription = async (subscriptionId: string, priceId: string) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch("/api/stripe/subscription", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           subscriptionId,
//           action: "update",
//           priceId,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to update subscription");
//       }

//       toast.success("Subscription updated successfully");
//     } catch (error) {
//       console.error("Error updating subscription:", error);
//       toast.error("Failed to update subscription");
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return {
//     isLoading,
//     createCheckoutSession,
//     cancelSubscription,
//     resumeSubscription,
//     updateSubscription,
//   };
// } 