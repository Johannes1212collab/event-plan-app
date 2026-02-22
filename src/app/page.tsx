import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Calendar, Image as ImageIcon, MessageCircle, BellRing, ThumbsUp } from "lucide-react";

export const metadata: Metadata = {
  title: "EventHub | Your Private Social Calendar",
  description: "The easiest way to organize gatherings, securely keep all your group photos in one place, and coordinate with friends.",
  openGraph: {
    title: "EventHub | Your Private Social Calendar",
    description: "The easiest way to organize gatherings, securely keep all your group photos in one place, and coordinate with friends.",
    siteName: "EventHub",
    images: ["/og-image.jpg"],
    type: "website",
  },
};

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-cyan-500/30">
      {/* Navigation */}
      <header className="px-4 lg:px-8 h-16 flex items-center border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 group" href="/">
          <div className="h-8 w-8 bg-black rounded-lg text-white flex items-center justify-center font-bold">EH</div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">EventHub</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="/login">
            Login
          </Link>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/register">Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden flex flex-col justify-center items-center py-20 lg:py-32">
          {/* Background Glow Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-400 blur-[100px] rounded-full mix-blend-screen" />
          </div>

          <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-4 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500 mr-2 animate-pulse"></span>
              The modern way to gather
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-foreground">
              Plan Events. Invite Friends. <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400">Share Memories.</span>
            </h1>

            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
              Ditch the messy group chats. EventHub brings your invitations, RSVPs, live chat, and shared photo galleries into one beautiful space.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
              <Button asChild size="lg" className="h-12 px-8 bg-black hover:bg-slate-800 text-white border-0 transition-all">
                <Link href="/register">Start Planning Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 border-border hover:bg-accent text-foreground">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="w-full py-20 bg-secondary/30 border-t border-border">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Feature 0 - Hero Bento Card */}
              <div className="md:col-span-2 lg:col-span-4 group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition-all flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ThumbsUp className="h-8 w-8 text-cyan-500" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Organize with ease</h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    Organize unique, personal, private events and share it amongst your close ones with a few easy clicks.
                  </p>
                </div>
              </div>

              {/* Feature 1 */}
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition-all">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Instant Discovery</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fire up the Event Scanner to instantly pull local concerts, festivals, and public gatherings directly to your dashboard.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-pink-500/30 transition-all">
                <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Private Galleries</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every event gets a shared cloud gallery. Guests can seamlessly upload and download original-quality photos and videos.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Live Chat</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Coordinate logistics with built-in real-time messaging, complete with message quoting and immediate UI updates.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all">
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BellRing className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Push Notifications</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Install the progressive web app to receive native mobile push notifications the second someone replies to you.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card py-8">
        <div className="container px-4 md:px-6 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <div className="h-6 w-6 bg-primary rounded flex items-center justify-center text-[10px] font-bold text-primary-foreground">EH</div>
            <p className="text-sm text-muted-foreground">© 2026 EventHub Inc. All rights reserved.</p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">
              Terms
            </Link>
            <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
