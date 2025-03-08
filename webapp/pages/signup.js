import React, { useState } from 'react';

import Head from "next/head";
import Link from "next/link";
import Brand from "@/components/ui/Brand";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { GoogleIcon } from "@/components/Icons";

export default function SignUp() {
    return (
        <>
            <Head>
                <title>Sign Up - BusBeacon</title>
            </Head>
            <main className='w-full h-screen flex flex-col items-center justify-center my- px-4'>
                <div className='max-w-sm w-full text-gray-300 bg-zinc-900/80 rounded-xl p-8 space-y-5 shadow-lg '>
                    <div className='text-center'>
                        <Brand className='mx-auto w-32' />
                        <div className='mt-5 space-y-2'>
                            <h1 className='text-white text-2xl font-bold sm:text-3xl'>
                                Create an account
                            </h1>
                            <p className=''>
                                Have an account?{" "}
                                <Link
                                    href='/login'
                                    className='font-medium text-yellow-500 hover:text-yellow-600 duration-150'>
                                    Login
                                </Link>
                            </p>
                        </div>
                    </div>
                    <form onSubmit={(e) => e.preventDefault()} className='mt-8 space-y-5'>
                        <div>
                            <label className='font-medium'>Username</label>
                            <Input
                                type='text'
                                required
                                className='w-full mt-2 text-zinc-200 bg-zinc-800 focus:bg-zinc-900 focus:border-zinc-800'
                            />
                        </div>
                        <div>
                            <label className='font-medium'>Password</label>
                            <Input
                                type='password'
                                required
                                className='w-full mt-2 text-zinc-300 bg-zinc-800 focus:bg-zinc-900 focus:border-zinc-800'
                            />
                        </div>
                        <Button className='w-full text-gray-800 bg-[#ffd800] hover:bg-yellow-200 ring-offset-2 focus:ring rounded-lg'>
                            Sign Up
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
