import { BackButton } from "@/components/back-button";

export const metadata = {
  title: "About — APK Store",
  description:
    "APK Store was created and is owned by Khaalid Cabdullaahi Maxamuud.",
};

export default function AboutPage() {
  return (
    <div className="px-4 pb-10">
      <BackButton label="About" />
      <div className="px-0 pt-2">
        <h1 className="text-xl font-bold mb-4">About APK Store</h1>

        <div className="p-4 rounded-2xl bg-white dark:bg-ink-700 border border-brand-100 dark:border-ink-100/10 space-y-3">
          <p className="text-sm text-ink/70 dark:text-cream/70">
            <strong className="text-ink dark:text-cream">APK Store</strong> is an
            APK and Progressive Web App marketplace.
          </p>
          <p className="text-sm text-ink/70 dark:text-cream/70">
            This platform was created and is owned by{" "}
            <strong className="text-ink dark:text-cream">
              Khaalid Cabdullaahi Maxamuud
            </strong>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
