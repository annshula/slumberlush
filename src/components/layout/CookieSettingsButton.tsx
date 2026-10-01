"use client";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      className="hover:text-ink"
      onClick={() => window.dispatchEvent(new Event("bl:cookie-settings"))}
    >
      Cookie settings
    </button>
  );
}
