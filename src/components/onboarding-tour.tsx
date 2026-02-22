"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { completeOnboarding } from "@/actions/user";

interface OnboardingTourProps {
    hasSeenOnboarding: boolean;
    page: "dashboard" | "event" | "discover" | "user";
}

export const OnboardingTour = ({
    hasSeenOnboarding,
    page,
}: OnboardingTourProps) => {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        if (page === "discover") {
            const hasSeenScannerTour = localStorage.getItem("hasSeenScannerTour");
            if (hasSeenScannerTour) return;
        } else if (page === "event") {
            // Use localStorage for the event tour so it doesn't conflict with global DB dashboard onboarding
            const hasSeenEventTour = localStorage.getItem("hasSeenEventTour");
            if (hasSeenEventTour) return;
        } else if (page === "user") {
            const hasSeenUserTour = localStorage.getItem("hasSeenUserTour");
            if (hasSeenUserTour) return;
        } else {
            if (hasSeenOnboarding) return;
        }

        // Initialize driver
        driverObj.current = driver({
            showProgress: true,
            animate: true,
            doneBtnText: "Done", // Text on the final button
            nextBtnText: "Next", // Text on the next button
            prevBtnText: "Previous", // Text on the previous button
            allowClose: true, // Whether clicking on overlay should close or not
            onDestroyStarted: () => {
                if (!driverObj.current.hasNextStep() || confirm("Skip the intro?")) {
                    driverObj.current.destroy();
                    // Mark as seen when destroy (skip or finish)
                    if (page === "discover") {
                        localStorage.setItem("hasSeenScannerTour", "true");
                    } else if (page === "event") {
                        localStorage.setItem("hasSeenEventTour", "true");
                    } else if (page === "user") {
                        localStorage.setItem("hasSeenUserTour", "true");
                    } else {
                        completeOnboarding();
                    }
                }
            },
            steps:
                page === "dashboard"
                    ? [
                        {
                            element: "#new-event-btn",
                            popover: {
                                title: "Create Your First Event",
                                description:
                                    "Click here to start planning! You can set a date, location, and invite friends.",
                                side: "bottom",
                                align: "start",
                            },
                        },
                        // Point to discover tab to encourage exploration
                        {
                            element: "#discover-tab",
                            popover: {
                                title: "Discover Local Events",
                                description: "Looking for something to do? Scan your area for public events to convert into private groups!",
                                side: "bottom",
                                align: "start",
                            }
                        },
                        {
                            element: "#user-profile-link-desktop",
                            popover: {
                                title: "Your User Profile",
                                description: "Click your name here anytime to view your public profile, which showcases the history of past events you've attended.",
                                side: "bottom",
                                align: "end",
                            }
                        },
                        {
                            element: "#notifications-bell",
                            popover: {
                                title: "Push Notifications",
                                description: "Click the bell to enable browser alerts for new poll/checklist changes or file uploads!",
                                side: "bottom",
                                align: "center",
                            }
                        },
                        {
                            element: "#share-site-btn",
                            popover: {
                                title: "Share The Application",
                                description: "Love the app? Click here to copy the link to EventHub or natively share it via mobile.",
                                side: "bottom",
                                align: "end",
                            }
                        },
                        {
                            popover: {
                                title: "Event Archiving & Image Requests",
                                description: "To keep our servers fast, media from old events will be archived after a few weeks. Don't worry, thumbnails are kept! If you ever want the original high-res image back, you can 'Request Original' from the chat, and the owner will get a notification right here on the dashboard.",
                            }
                        }
                    ]
                    : page === "discover"
                        ? [
                            {
                                element: "#scanner-center",
                                popover: {
                                    title: "Search Center",
                                    description: "Start by entering a city or venue, or simply click 'Around me' to use your device GPS.",
                                    side: "bottom",
                                    align: "start",
                                },
                            },
                            {
                                element: "#scanner-radius",
                                popover: {
                                    title: "Adjust the Radius",
                                    description: "Slide to expand or shrink how far out you want to search for events (up to 100km).",
                                    side: "bottom",
                                    align: "start",
                                },
                            },
                            {
                                element: "#scanner-dates",
                                popover: {
                                    title: "Filter by Date",
                                    description: "Looking for plans tonight? Hit 'Today Only', or enter a custom weekend date range.",
                                    side: "top",
                                    align: "start",
                                },
                            },
                            {
                                element: "#scanner-find",
                                popover: {
                                    title: "Scan Databases",
                                    description: "Click here to aggregate public events from Google and other providers. Once found, you can convert them directly into private EventHub groups!",
                                    side: "top",
                                    align: "start",
                                },
                            }
                        ]
                        : page === "user"
                            ? [
                                {
                                    popover: {
                                        title: "Public User Profiles",
                                        description: "This is a public user profile! Here you can see a user's historical portfolio of past events, their following counts, and interact with them.",
                                        side: "bottom",
                                        align: "center",
                                    }
                                },
                                {
                                    element: "#profile-edit-avatar",
                                    popover: {
                                        title: "Avatar Images",
                                        description: "If this is your profile, click your avatar to change your picture instantly! If you're visiting someone else, click their avatar to follow them.",
                                        side: "bottom",
                                        align: "start"
                                    }
                                }
                            ]
                            : [
                                {
                                    element: "#event-title-card",
                                    popover: {
                                        title: "Event Details",
                                        description: "Here you can see the main info about the event.",
                                        side: "bottom",
                                        align: "start",
                                    },
                                },
                                {
                                    element: "#event-checklist",
                                    popover: {
                                        title: "Shared To-Do List",
                                        description: "Who is bringing what? Add items to the checklist here so friends can claim responsibility for them.",
                                        side: "bottom",
                                        align: "start",
                                    }
                                },
                                {
                                    element: "#event-polls",
                                    popover: {
                                        title: "Activity Suggestions",
                                        description: "Not sure where to eat? Create a poll and let the group vote on the best options.",
                                        side: "top",
                                        align: "start",
                                    }
                                },
                                {
                                    element: "#chat-paperclip",
                                    popover: {
                                        title: "Share Photos & Videos",
                                        description:
                                            "Click the paperclip to upload media to the gallery. Everyone can contribute!",
                                        side: "top",
                                        align: "start",
                                    },
                                },
                                {
                                    element: "#event-actions",
                                    popover: {
                                        title: "Share & Manage",
                                        description: "Invite friends via email, get a QR code, or add to your calendar from here.",
                                        side: "bottom",
                                        align: "end"
                                    }
                                },
                                {
                                    element: "#media-gallery",
                                    popover: {
                                        title: "Media Gallery",
                                        description:
                                            "All shared photos and videos will appear here. Click 'Select' to download them.",
                                        side: "top",
                                        align: "start",
                                    },
                                },
                                {
                                    element: "#delete-event-btn",
                                    popover: {
                                        title: "Delete Event",
                                        description:
                                            "Need to cancel? You can delete the event here (only if you are the host).",
                                        side: "top",
                                        align: "end",
                                    },
                                },
                            ],
        });

        // Start the tour
        // Small delay to ensure elements are mounted
        const timer = setTimeout(() => {
            driverObj.current.drive();
        }, 1000);

        return () => clearTimeout(timer);
    }, [hasSeenOnboarding, page]);

    return null; // This component doesn't render anything visible
};
