
"use client";

import { useState, useTransition } from "react";
import { login } from "@/actions/login";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const LoginForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const onSubmit = (formData: FormData) => {
        setError("");
        setSuccess("");

        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        startTransition(() => {
            login({ email, password })
                .then((data) => {
                    if (data?.error) {
                        setError(data.error);
                    }

                })
                .catch(() => setError("Something went wrong"));
        });
    };

    return (
        <Card className="w-[400px] shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={onSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                            <Input
                                id="email"
                                name="email"
                                disabled={isPending}
                                placeholder="john.doe@example.com"
                                type="email"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">Password</label>
                            <Input
                                id="password"
                                name="password"
                                disabled={isPending}
                                placeholder="******"
                                type="password"
                                required
                            />
                        </div>
                    </div>
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <Button disabled={isPending} type="submit" className="w-full">
                        Login
                    </Button>
                </form>
            </CardContent>
            <CardFooter>
                <Button variant="link" className="font-normal w-full" size="sm" asChild>
                    <Link href="/register">
                        Don't have an account?
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};
