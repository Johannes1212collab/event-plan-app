
"use server";

import bcrypt from "bcryptjs";
import db from "@/lib/db";

export const register = async (values: any) => {
    const { email, password, name } = values;

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

    return { success: "User created!" };
};
