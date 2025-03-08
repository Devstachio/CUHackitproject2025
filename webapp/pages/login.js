import Head from "next/head";
import Link from "next/link";
import Brand from "@/components/ui/Brand";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { GoogleIcon } from "@/components/Icons";

export default function Login() {
  return (
    <>
      <Head>
        <title>Login - BusBeacon</title>
      </Head>
      <main className='w-full h-screen flex flex-col items-center justify-center  px-4'>
        <div className='max-w-sm w-full text-gray-300 bg-zinc-900/80 rounded-xl p-8 space-y-5'>
          <div className='text-center'>
            <Brand className='mx-auto w-32' />
            <div className='mt-5 space-y-2'>
              <h1 className='text-white text-2xl font-bold sm:text-3xl'>
                Log in to your account
              </h1>
              <p className=''>
                Don't have an account?{" "}
                <Link
                  href='/signup'
                  className='font-medium text-yellow-500 hover:text-yellow-600 duration-150'>
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className='mt-8 space-y-5'>
            <div>
              <label className='font-medium'>Username</label>
              <Input
                type='username'
                required
                className='w-full mt-2 text-gray-300 bg-gray-800 focus:bg-gray-900 focus:border-gray-800'
              />
            </div>
            <div>
              <label className='font-medium'>Password</label>
              <Input
                type='password'
                required
                className='w-full mt-2 text-gray-300 bg-gray-800 focus:bg-gray-900 focus:border-gray-800'
              />
            </div>
            <Button className='w-full text-gray-800 bg-gray-100 hover:bg-gray-200 ring-offset-2 focus:ring rounded-lg'>
              Sign in
            </Button>
            <button
              type='button'
              className='w-full flex items-center justify-center gap-x-3 py-2.5 border border-gray-800 rounded-lg text-sm font-medium bg-gray-800/40 hover:bg-gray-800 ring-purple-500 focus:ring duration-150'>
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
