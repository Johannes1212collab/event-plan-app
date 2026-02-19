
"use server";

import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export const register = async (values: any) => {
    const { email, password, name, callbackUrl } = values;

    if (!email || !password || !name) {
        return { error: "Missing required fields!" };
    }

    const existingUser = await db.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        return { error: "Email already in use!" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    // Auto-login after registration
    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: callbackUrl || "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Registration successful, but auto-login failed." };
        }
        throw error;
    }

    return { success: "User created!" };
};
