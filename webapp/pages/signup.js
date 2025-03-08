import Head from "next/head";
import Link from "next/link";
import Brand from "@/components/ui/Brand";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { GoogleIcon } from "@/components/Icons";
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient"; // Import Supabase client

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  // Handle email/password sign-up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username, // Add additional user metadata (e.g., username)
          },
        },
      });

      if (error) throw error;

      // Redirect to the home page or a confirmation page
      router.push("/");
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle Google OAuth sign-up
  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - BusBeacon</title>
      </Head>
      <main className="w-full h-screen flex flex-col items-center justify-center my- px-4">
        <div className="max-w-sm w-full text-gray-300 bg-zinc-900/80 rounded-xl p-8 space-y-5 shadow-lg ">
          <div className="text-center">
            <Brand className="mx-auto w-32" />
            <div className="mt-5 space-y-2">
              <h1 className="text-white text-2xl font-bold sm:text-3xl">
                Create an account
              </h1>
              <p className="">
                Have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#ffd800] hover:text-yellow-600 duration-150"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
          <form onSubmit={handleSignUp} className="mt-8 space-y-5">
            {/* Username Input */}
            <div>
              <label className="font-medium">Username</label>
              <Input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-2 text-zinc-200 bg-zinc-800 focus:bg-zinc-900 focus:border-zinc-800"
              />
            </div>
            {/* Email Input */}
            <div>
              <label className="font-medium">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-2 text-zinc-200 bg-zinc-800 focus:bg-zinc-900 focus:border-zinc-800"
              />
            </div>
            {/* Password Input */}
            <div>
              <label className="font-medium">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-2 text-zinc-300 bg-zinc-800 focus:bg-zinc-900 focus:border-zinc-800"
              />
            </div>
            {/* Error Message */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {/* Sign Up Button */}
            <Button
              type="submit"
              className="w-full text-gray-800 bg-[#ffd800] hover:bg-yellow-600 ring-offset-2 focus:ring rounded-lg"
            >
              Sign Up
            </Button>
            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-x-3 py-2.5 border border-gray-800 rounded-lg text-sm font-medium bg-gray-800/40 hover:bg-gray-800 ring-purple-500 focus:ring duration-150"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        </div>
      </main>
    </>
  );
}