import { createFileRoute } from "@tanstack/react-router";
import { useId } from "react";

export const Route = createFileRoute("/terms-and-conditions")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main
      aria-labelledby="title"
      className="prose max-w-2xl mx-auto p-4 text-justify"
    >
      <header>
        <h1 id={useId()} className="mb-1">
          Terms &amp; Conditions - NotesPal
        </h1>
        <span>
          <strong>Last updated:</strong> October 31, 2025
        </span>
        <p>
          Welcome to <strong>NotesPal</strong>, operated and owned by{" "}
          <strong>Siddhesh Agarwal</strong> (“we,” “our,” or “us”). These Terms
          and Conditions (“Terms”) govern your access to and use of the NotesPal
          application, website, and related services (collectively, the
          “Service”). By creating an account or using NotesPal, you agree to be
          bound by these Terms.
        </p>
      </header>

      <section id={useId()}>
        <h2>1. Eligibility</h2>
        <p>
          You must be at least 13 years old (or the legal age in your country)
          to use NotesPal. By using the Service, you confirm that you meet this
          requirement and have the legal capacity to agree to these Terms.
        </p>
      </section>

      <section id={useId()}>
        <h2>2. Account Registration</h2>
        <p>
          NotesPal uses <strong>Clerk</strong> as its authentication provider.
          You must create an account using a valid email address or another
          supported login method via Clerk. We store limited account information
          — specifically your <strong>name and email</strong> — to enable
          encryption and synchronization of your notes across devices.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your
          credentials and for all activity that occurs under your account. We
          may suspend or terminate accounts that violate these Terms or engage
          in unauthorized activity.
        </p>
      </section>

      <section id={useId()}>
        <h2>3. Subscription and Payment</h2>
        <p>
          NotesPal operates on a subscription model priced at{" "}
          <strong>$5 per year</strong>. All payments are securely processed
          through <strong>Polar.sh</strong>. Subscriptions automatically renew
          unless canceled before the renewal date.
        </p>
        <p>
          We reserve the right to change the subscription price, with advance
          notice provided via email or within the app.
        </p>
      </section>

      <section id={useId()}>
        <h2>4. Data Storage and Encryption</h2>
        <p>
          Your notes and related data are stored on{" "}
          <strong>Cloudflare D1</strong>, a third-party cloud database. NotesPal
          uses <strong>end-to-end encryption</strong> for note content — meaning
          your notes are encrypted before storage and cannot be read by us or by
          Cloudflare. However, we may process encrypted metadata (e.g.,
          timestamps, sync markers) to enable global access and synchronization.
        </p>
        <p>
          Your email address may be used as part of the encryption key mechanism
          to ensure secure access across devices. By using NotesPal, you consent
          to this data handling and encryption process.
        </p>
      </section>

      <section id={useId()}>
        <h2>5. Data Sync and Access</h2>
        <p>
          To allow global access to your notes, NotesPal synchronizes your
          encrypted data across our servers. We do <strong>not</strong> sell,
          rent, or share your personal information or note contents with third
          parties beyond the necessary integration with Clerk, Polar.sh, and
          Cloudflare.
        </p>
        <p>
          You are responsible for maintaining a secure password and protecting
          your devices from unauthorized access.
        </p>
      </section>

      <section id={useId()}>
        <h2>6. Acceptable Use</h2>
        <p>You agree not to use NotesPal for:</p>
        <ul>
          <li>Uploading illegal, harmful, or infringing content;</li>
          <li>Attempting to access or disrupt another user’s data;</li>
          <li>
            Reverse engineering, copying, or redistributing the app without
            permission.
          </li>
        </ul>
        <p>
          Violation of these terms may result in account suspension or legal
          action.
        </p>
      </section>

      <section id={useId()}>
        <h2>7. Intellectual Property</h2>
        <p>
          All rights, trademarks, and content related to NotesPal (excluding
          user-created content) are owned by <strong>Siddhesh Agarwal</strong>.
          You may not copy, modify, or distribute NotesPal’s software or design
          without prior written consent.
        </p>
      </section>

      <section id={useId()}>
        <h2>8. Disclaimer of Warranties</h2>
        <p>
          NotesPal is provided on an <strong>“as is”</strong> and{" "}
          <strong>“as available”</strong> basis. We do not guarantee
          uninterrupted access, error-free performance, or absolute security of
          stored data. While we employ strong encryption and reputable
          third-party providers (Clerk, Polar.sh, Cloudflare), no system is
          completely immune to vulnerabilities.
        </p>
        <p>Use the Service at your own risk.</p>
      </section>

      <section id={useId()}>
        <h2>9. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law,{" "}
          <strong>Siddhesh Agarwal</strong> shall not be liable for any
          indirect, incidental, or consequential damages resulting from your use
          of or inability to use NotesPal.
        </p>
      </section>

      <section id={useId()}>
        <h2>10. Termination</h2>
        <p>
          You may delete your account at any time. Upon deletion, your data will
          be removed from active systems immediately.
        </p>
        <p>
          We reserve the right to suspend or terminate accounts that violate
          these Terms or pose a risk to our infrastructure or other users.
        </p>
      </section>

      <section id={useId()}>
        <h2>11. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Updates will be posted
          within the app or at{" "}
          <a href="https://siddhesh.cc" target="_blank" rel="noopener">
            siddhesh.cc
          </a>
          . Continued use after an update constitutes acceptance of the revised
          Terms.
        </p>
      </section>

      <section id={useId()}>
        <h2>12. Contact Us</h2>
        <p>For questions, support, or legal inquiries, reach out to:</p>
        <strong>Siddhesh Agarwal</strong>
        <ul>
          <li>
            Email:{" "}
            <a href="mailto:siddhesh.agarwal@gmail.com">
              siddhesh.agarwal@gmail.com
            </a>
          </li>
          <li>
            Website:{" "}
            <a
              href="https://siddhesh.cc"
              target="_blank"
              rel="noopener noreferrer"
            >
              siddhesh.cc
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
