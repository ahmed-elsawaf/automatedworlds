import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read our Privacy Policy to understand how we collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: April 25, 2026</p>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
          <p>
            Welcome to AutomatedWorlds. We value your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website 
            and use our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">2. Data We Collect</h2>
          <p>
            We collect information that you provide directly to us when you create an account, make a purchase, 
            or communicate with us. This may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account Information: Name, email address, and profile picture (via Clerk).</li>
            <li>Transaction Information: Purchase history and order details (processed via Polar).</li>
            <li>Communication Information: Any messages you send to us via our support or customization channels.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">3. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our services.</li>
            <li>Process transactions and send related information, including confirmations and receipts.</li>
            <li>Send technical notices, updates, security alerts, and support messages.</li>
            <li>Respond to your comments, questions, and requests.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">4. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal data. We may share information with third-party vendors and service providers 
            who perform services for us, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Clerk (Authentication and User Management)</li>
            <li>Polar (Payments and Digital Distribution)</li>
            <li>Convex (Database and Backend Services)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">5. Your Choices</h2>
          <p>
            You may update or correct your account information at any time by logging into your account settings. 
            You can also request the deletion of your personal data by contacting us at privacy@automatedworlds.com.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">6. Security</h2>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse, 
            and unauthorized access, disclosure, alteration, and destruction.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            <span className="text-primary font-medium">privacy@automatedworlds.com</span>
          </p>
        </section>
      </div>
    </div>
  );
}
