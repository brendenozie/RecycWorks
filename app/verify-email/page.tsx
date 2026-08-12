"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckBadgeIcon, 
  ExclamationCircleIcon, 
  ArrowPathIcon,
  CpuChipIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { cn } from "@/lib/utils";

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Authenticating your credentials...");
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setStatus("error");
        setMessage("Missing verification parameters. Please use the link sent to your email.");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Your account is now active and integrated into the RecycOp model.");
          // Auto-redirect after 3 seconds
          setTimeout(() => router.push("/login?verified=true"), 3500);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("A network error occurred. Please try again later.");
      }
    };

    verify();
  }, [token, email, router]);

  return (
    <div className="min-h-screen bg-[#0a0118] relative flex items-center justify-center overflow-hidden px-4">
      {/* Background Cinematic Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-2xl relative z-10 text-center"
      >
        {/* Branding */}
        <div className="flex justify-center mb-10">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CpuChipIcon className="w-8 h-8" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <ArrowPathIcon className="w-16 h-16 text-emerald-500 animate-spin mx-auto opacity-50" />
              <h1 className="text-2xl font-serif italic text-white">Verifying Identity</h1>
              <p className="text-purple-200/40 text-sm tracking-widest uppercase font-black">{message}</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <CheckBadgeIcon className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-serif italic text-white">Access Granted</h1>
              <p className="text-purple-200/60 leading-relaxed max-w-xs mx-auto text-sm font-medium">
                {message}
              </p>
              <div className="pt-6">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 bg-emerald-500 text-[#0a0118] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all group"
                >
                  Proceed to Login
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <ExclamationCircleIcon className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-serif italic text-white">Verification Failed</h1>
              <p className="text-red-200/60 leading-relaxed max-w-xs mx-auto text-sm">
                {message}
              </p>
              <div className="pt-6">
                <Link 
                  href="/register" 
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase tracking-widest"
                >
                  Request New Link
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-[10px] text-purple-200/20 uppercase tracking-[0.3em] font-black">
            RecycOp Intelligence Systems • Kenya 2030
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Wrapping in Suspense for useSearchParams()
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
        <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin opacity-20" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
// import { toast } from "sonner";

// export default function VerifyEmailPage() {
//   const [verifying, setVerifying] = useState(false);
//   const [verified, setVerified] = useState(false);
//   const [error, setError] = useState("");
//   const [resending, setResending] = useState(false);
//   const [email, setEmail] = useState("");

//   const router = useRouter();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const token = searchParams.get("token");
//     const emailParam = searchParams.get("email");

//     if (!token) {
//       setError("Invalid verification link");
//       return;
//     }

//     if (emailParam) {
//       setEmail(emailParam);
//     }

//     // Auto-verify the email
//     verifyEmail(token);
//   }, [searchParams]);

//   const verifyEmail = async (token: string) => {
//     setVerifying(true);
//     try {
//       const response = await fetch("/api/auth/verify-email", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ token }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setVerified(true);
//         toast.success("Email verified successfully!");
//       } else {
//         setError(data.error || "Failed to verify email");
//         toast.error(data.error || "Failed to verify email");
//       }
//     } catch (error) {
//       setError("An error occurred during verification");
//       toast.error("An error occurred during verification");
//     } finally {
//       setVerifying(false);
//     }
//   };

//   const resendVerification = async () => {
//     if (!email) {
//       toast.error("Email not found. Please try registering again.");
//       return;
//     }

//     setResending(true);
//     try {
//       const response = await fetch("/api/auth/resend-verification", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         toast.success("Verification email sent successfully!");
//       } else {
//         toast.error(data.error || "Failed to resend verification email");
//       }
//     } catch (error) {
//       toast.error("An error occurred. Please try again.");
//     } finally {
//       setResending(false);
//     }
//   };

//   if (verifying) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
//         <div className="w-full max-w-md">
//           {/* Logo */}
//           <div className="flex items-center justify-center mb-8">
//             <Link href="/" className="relative h-10">
//               <img
//                 src="/logo-light.png"
//                 alt="GIFTECHLogo"
//                 className="h-10 w-auto dark:hidden"
//               />
//               <img
//                 src="/logo-dark.png"
//                 alt="GIFTECHLogo"
//                 className="h-10 w-auto hidden dark:block"
//               />
//             </Link>
//           </div>

//           <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
//             <CardHeader className="text-center">
//               <RefreshCw className="h-16 w-16 text-green-600 mx-auto mb-4 animate-spin" />
//               <CardTitle className="text-2xl text-black dark:text-white">
//                 Verifying Email...
//               </CardTitle>
//               <CardDescription className="text-gray-600 dark:text-gray-400">
//                 Please wait while we verify your email address
//               </CardDescription>
//             </CardHeader>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   if (verified) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
//         <div className="w-full max-w-md">
//           {/* Logo */}
//           <div className="flex items-center justify-center mb-8">
//             <Link href="/" className="relative h-10">
//               <img
//                 src="/logo-light.png"
//                 alt="GIFTECHLogo"
//                 className="h-10 w-auto dark:hidden"
//               />
//               <img
//                 src="/logo-dark.png"
//                 alt="GIFTECHLogo"
//                 className="h-10 w-auto hidden dark:block"
//               />
//             </Link>
//           </div>

//           <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
//             <CardHeader className="text-center">
//               <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
//               <CardTitle className="text-2xl text-black dark:text-white">
//                 Email Verified!
//               </CardTitle>
//               <CardDescription className="text-gray-600 dark:text-gray-400">
//                 Your email has been successfully verified. You can now log in to
//                 your account.
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <Link href="/login" className="w-full">
//                 <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
//                   Continue to Login
//                 </Button>
//               </Link>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
//         <div className="w-full max-w-md">
//           {/* Logo */}
//           <div className="flex items-center justify-center mb-8">
//             <Link href="/" className="relative h-10">
//               <img
//                 src="/logo-light.png"
//                 alt="GIFTECHLogo"
//                 className="h-10 w-auto dark:hidden"
//               />
//               <img
//                 src="/logo-dark.png"
//                 alt="GIFTECHLogo"
//                 className="h-10 w-auto hidden dark:block"
//               />
//             </Link>
//           </div>

//           <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
//             <CardHeader className="text-center">
//               <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
//               <CardTitle className="text-2xl text-black dark:text-white">
//                 Verification Failed
//               </CardTitle>
//               <CardDescription className="text-gray-600 dark:text-gray-400">
//                 {error}
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
//                 The verification link may have expired or is invalid. You can
//                 request a new verification email.
//               </p>
//               <div className="space-y-2">
//                 <Button
//                   onClick={resendVerification}
//                   disabled={resending}
//                   className="w-full bg-green-600 hover:bg-green-700 text-white"
//                 >
//                   {resending ? (
//                     <>
//                       <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
//                       Sending...
//                     </>
//                   ) : (
//                     <>
//                       <Mail className="w-4 h-4 mr-2" />
//                       Resend Verification Email
//                     </>
//                   )}
//                 </Button>
//                 <Link href="/login" className="w-full">
//                   <Button variant="outline" className="w-full">
//                     Back to Login
//                   </Button>
//                 </Link>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   // Default state (should not reach here)
//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
//       <div className="w-full max-w-md">
//         {/* Logo */}
//         <div className="flex items-center justify-center mb-8">
//           <Link href="/" className="relative h-10">
//             <img
//               src="/logo-light.png"
//               alt="GIFTECHLogo"
//               className="h-10 w-auto dark:hidden"
//             />
//             <img
//               src="/logo-dark.png"
//               alt="GIFTECHLogo"
//               className="h-10 w-auto hidden dark:block"
//             />
//           </Link>
//         </div>

//         <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
//           <CardHeader className="text-center">
//             <CardTitle className="text-2xl text-black dark:text-white">
//               Email Verification
//             </CardTitle>
//             <CardDescription className="text-gray-600 dark:text-gray-400">
//               Processing your verification request...
//             </CardDescription>
//           </CardHeader>
//         </Card>
//       </div>
//     </div>
//   );
// }
