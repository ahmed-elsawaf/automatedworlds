import { Mail, MessageCircle, MapPin, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the AutomatedWorlds team for support, inquiries, or feedback.",
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Get in Touch</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Have questions about an idea? Need support with your purchase? 
          We're here to help you get your SaaS off the ground.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Email Us</h3>
              <p className="text-muted-foreground mb-2 text-sm">For general inquiries and support:</p>
              <a href="mailto:hello@automatedworlds.com" className="text-primary hover:underline font-medium">hello@automatedworlds.com</a>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-500 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Social Media</h3>
              <p className="text-muted-foreground mb-2 text-sm">Follow us on Twitter for updates:</p>
              <a href="https://twitter.com/automatedworlds" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline font-medium">@automatedworlds</a>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Location</h3>
              <p className="text-muted-foreground text-sm">Remote-first team. Building worldwide.</p>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-border/60 bg-muted/20">
            <h4 className="font-bold mb-2">Technical Support</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you've purchased source code and are having trouble with deployment, 
              please check the `README.md` included in your download first. 
              If the issue persists, include your Order ID in your email.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="p-8 sm:p-10 rounded-4xl border border-border/60 bg-card shadow-sm">
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="John Doe" className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input placeholder="john@example.com" type="email" className="rounded-xl h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Inquiry about AI CRM" className="rounded-xl h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  placeholder="How can we help you?" 
                  rows={6} 
                  className="rounded-2xl resize-none" 
                />
              </div>

              <Button type="button" className="w-full h-12 rounded-xl gap-2 brand-gradient border-0 text-white font-semibold">
                <Send className="w-4 h-4" /> Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
