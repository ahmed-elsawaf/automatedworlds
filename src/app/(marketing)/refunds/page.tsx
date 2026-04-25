import { RotateCcw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Read our Refund Policy to understand our rules on digital goods and customization services.",
};

export default function RefundsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <RotateCcw className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
          <p className="text-muted-foreground">Last updated: April 25, 2026</p>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">1. Digital Goods Policy</h2>
          <p>
            Due to the nature of digital products, such as SaaS source code, AutomatedWorlds generally 
            operates on a <strong>no-refund policy</strong>. Once access to the source code has been 
            granted or the files have been downloaded, the product is considered "used" and is 
            ineligible for a refund.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">2. Exceptions</h2>
          <p>
            We may consider refund requests under the following limited circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Technical Defect:</strong> If the source code is 
              proven to be broken or significantly different from the advertised demo, and our support 
              team is unable to resolve the issue within 7 business days.
            </li>
            <li>
              <strong className="text-foreground">Duplicate Purchase:</strong> If you accidentally 
              purchased the same product twice.
            </li>
            <li>
              <strong className="text-foreground">Non-Delivery:</strong> If you did not receive the 
              download link or access to the code despite a successful payment.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">3. Customization Services</h2>
          <p>
            Deposits for customization services are non-refundable once work has commenced. 
            If you change your mind before our team starts working on your request, a full refund 
            of the deposit may be issued minus processing fees.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">4. Refund Process</h2>
          <p>
            To request a refund, please email <span className="text-primary font-medium">support@automatedworlds.com</span> with 
            your order ID and a detailed explanation of the reason for your request. 
            All requests must be submitted within 14 days of purchase.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">5. Chargebacks</h2>
          <p>
            We encourage you to contact us directly if you have an issue with your purchase. 
            Initiating a chargeback without first attempting to resolve the matter with our support team 
            will result in a permanent ban from our platform.
          </p>
        </section>
      </div>
    </div>
  );
}
