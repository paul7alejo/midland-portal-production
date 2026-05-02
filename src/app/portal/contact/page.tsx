"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function ContactPage() {
  const { patient } = useAuth();
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!patient) return null;

  const phoneLink = (
    <a href="tel:0800000000" className="text-deep-teal font-medium hover:underline">
      0800 000 000
    </a>
  );

  const emailLink = (
    <a href="mailto:hello@midlandsleep.co.nz" className="text-deep-teal font-medium hover:underline">
      hello@midlandsleep.co.nz
    </a>
  );

  const handleSubmit = () => {
    // Demo only — no real email sent.
    // Phase 1B: this will create a comms record in DynamoDB
    // and optionally send via SES.
    setIsSubmitted(true);
  };

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        Contact Midland Sleep
      </h1>
      <p className="text-sm text-charcoal/70 mb-8">
        We are here to help with your CPAP care.
      </p>

      <div className="grid gap-8 md:grid-cols-2">

        {/* Left column — contact details */}
        <div className="space-y-6">
          <section className="bg-white border border-sand rounded-lg p-6 space-y-4">
            <h2 className="font-display text-xl text-navy">Get in touch</h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                  Phone
                </p>
                <p className="text-lg font-medium text-charcoal">
                  {phoneLink}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                  Email
                </p>
                <p className="text-charcoal">
                  {emailLink}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                  Hours
                </p>
                <p className="text-charcoal">
                  Monday to Friday, 8:30am to 5pm
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-charcoal/60 font-mono mb-1">
                  Address
                </p>
                <p className="text-charcoal">
                  Midland Sleep Ltd
                </p>
                <p className="text-sm text-charcoal/70">
                  Waikato, New Zealand
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right column — contact form */}
        <div>
          {isSubmitted ? (
            <div className="bg-seafoam-pale border border-seafoam/30 rounded-lg p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-seafoam/20 flex items-center justify-center mx-auto">
                <span className="text-seafoam text-xl">&#10003;</span>
              </div>
              <h2 className="font-display text-xl text-navy">
                Your message has been sent
              </h2>
              <p className="text-sm text-charcoal/70">
                We will get back to you within 1-2 business days.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setCategory("");
                  setMessage("");
                }}
                className="text-sm text-deep-teal hover:underline mt-2"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Privacy notice — HIPC Rule 3 */}
              <div className="bg-sky-blue border border-deep-teal/10 rounded-lg px-4 py-3">
                <p className="text-xs text-charcoal/80">
                  Your message will be received by Midland Sleep staff. We handle
                  your information in accordance with the Health Information
                  Privacy Code 2020.
                </p>
              </div>

              <div className="bg-white border border-sand rounded-lg p-6 space-y-4">
                <h2 className="font-display text-xl text-navy">Send a message</h2>

                {/* Name — pre-filled, read-only */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={patient.name}
                    readOnly
                    className="w-full px-3 py-2 border border-sand rounded-md
                               bg-cream text-charcoal text-sm cursor-not-allowed"
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-charcoal mb-1"
                  >
                    What is this about?
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-sand rounded-md
                               bg-white text-charcoal text-sm
                               focus:outline-none focus:ring-2 focus:ring-deep-teal
                               focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    <option value="general">General enquiry</option>
                    <option value="equipment">Equipment question</option>
                    <option value="supplies">Supplies and reorders</option>
                    <option value="maintenance">Maintenance and safety checks</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-charcoal mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    rows={4}
                    className="w-full px-3 py-2 border border-sand rounded-md
                               focus:outline-none focus:ring-2 focus:ring-deep-teal
                               focus:border-transparent bg-white text-charcoal
                               placeholder:text-charcoal/40 text-sm"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!category || !message.trim()}
                  className="bg-deep-teal text-white px-6 py-2.5 rounded-full text-sm
                             font-medium hover:bg-deep-teal/90 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send message
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
