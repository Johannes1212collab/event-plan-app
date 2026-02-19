
"use client";

import { useState, useTransition } from "react";
import { register } from "@/actions/register";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import Link from "next/link";

export const RegisterForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();

    const onSubmit = (formData: FormData) => {
        setError("");
        setSuccess("");

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        startTransition(() => {
            register({ name, email, password })
                .then((data) => {
                    setError(data.error);
                    setSuccess(data.success);
                });
        });
    };

    return (
        <Card className="w-[400px] shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={onSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">Name</label>
                            <Input
                                id="name"
                                name="name"
                                disabled={isPending}
                                placeholder="John Doe"
                                type="text"
                                required
                            />
                        </div>
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
                        Create an account
                    </Button>
                </form>
            </CardContent>
            <CardFooter>
                <Button variant="link" className="font-normal w-full" size="sm" asChild>
                    <Link href="/login">
                        Already have an account?
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};
