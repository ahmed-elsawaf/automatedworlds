import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read our Terms of Service to understand your rights and responsibilities when using AutomatedWorlds.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: April 25, 2026</p>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using AutomatedWorlds, you agree to be bound by these Terms of Service. 
            If you do not agree to all of these terms, do not use our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">2. Description of Service</h2>
          <p>
            AutomatedWorlds is a marketplace for SaaS ideas, source code, and customization services. 
            We provide researched business opportunities and the technical assets required to launch them.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">3. Intellectual Property</h2>
          <p>
            Upon purchase of "Source Code", you are granted a non-exclusive, worldwide license to use, 
            modify, and deploy the code for your own projects. You may not resell the source code 
            itself as a template or product.
          </p>
          <p>
            Upon purchase of an "Exclusive License", we will mark the idea as "Sold Out" and 
            will not sell the source code to any other party from that point forward.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">4. User Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account and for all activities 
            that occur under your account. You must notify us immediately of any unauthorized uses 
            of your account or any other breaches of security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">5. Payments and Refunds</h2>
          <p>
            All payments are processed securely through Polar. Due to the digital nature of our 
            products (source code), all sales are final unless otherwise stated in our 
            Refund Policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">6. Limitation of Liability</h2>
          <p>
            AutomatedWorlds provides ideas and code "as is" without any warranty. We are not 
            responsible for the success or failure of your business ventures using our products.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of 
            significant changes by posting the new terms on this page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">8. Contact</h2>
          <p>
            Questions about the Terms of Service should be sent to:
            <br />
            <span className="text-primary font-medium">legal@automatedworlds.com</span>
          </p>
        </section>
      </div>
    </div>
  );
}
