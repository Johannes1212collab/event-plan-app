"use server";

import nodemailer from "nodemailer";
import { auth } from "@/auth";
import { getEventById } from "@/actions/event";

export async function inviteGuest(eventId: string, email: string) {
    const session = await auth();
    if (!session?.user) {
        return { error: "You must be logged in to invite guests." };
    }

    const event = await getEventById(eventId);
    if (!event) {
        return { error: "Event not found." };
    }

    // Check environment variables
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
        console.error("Missing EMAIL_SERVER_USER or EMAIL_SERVER_PASSWORD");
        return { error: "Server email configuration is missing." };
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
    });

    const inviteLink = `${process.env.AUTH_URL || "https://eventhub.community"}/events/${event.id}`;

    try {
        await transporter.sendMail({
            from: `"EventHub" <${process.env.EMAIL_SERVER_USER}>`,
            to: email,
            subject: `You're invited to ${event.title}!`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #000;">EventHub</h1>
                    </div>
                    <h2>You're invited! 🎉</h2>
                    <p><strong>${session.user.name}</strong> has invited you to join <strong>${event.title}</strong>.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${new Date(event.date).toLocaleDateString()} at ${new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${event.location || "TBD"}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Event</a>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        If the button doesn't work, copy and paste this link into your browser:<br/>
                        <a href="${inviteLink}" style="color: #000;">${inviteLink}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="text-align: center; font-size: 12px; color: #999;">
                        EventHub - Plan Events. Invite Friends. Share Memories.
                    </p>
                </div>
            `,
        });

        return { success: "Invitation sent!" };
    } catch (error) {
        console.error("Email error:", error);
        return { error: "Failed to send email. Please check the email address." };
    }
}
