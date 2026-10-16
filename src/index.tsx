import { useEffect, useRef, useState } from "react";

export type WaysdropProfile = "courier" | "store";

export interface WaysdropWidgetOptions {
    /** Public API key (wsp_pub_...). Never use a secret key in the browser. */
    publicKey: string;
    /** Which of the key owner's profiles the widget acts as. Default "courier". */
    profile?: WaysdropProfile;
    /** ISO country code, e.g. "NG". Forces the display currency; detected from the visitor when omitted. */
    country?: string;
    /** Floating launcher text. */
    label?: string;
    /** Floating launcher colour. */
    color?: string;
    position?: "bottom-right" | "bottom-left";
    /** Render no floating launcher; open it with `open()` from `useWaysdrop`. */
    launcher?: boolean;
    /** Override the widget host (staging/local). Default https://waysdrop.com */
    host?: string;
    /** Called when a payment settles (or is still being confirmed). */
    onPayment?: (payment: WaysdropPayment) => void;
    onClose?: () => void;
}

export interface WaysdropPayment {
    reference: string;
    kind: "P2P" | "ORDER";
    status: "PENDING" | "SUCCESS" | "FAILED";
    final: boolean;
    trackingId: string | null;
    deliveryId: string | null;
    orderNumber: string | null;
}

interface WaysdropGlobal {
    open(): void;
    close(): void;
    destroy(): void;
    on(event: "ready" | "close" | "error", fn: (payload?: unknown) => void): void;
    on(event: "payment", fn: (payment: WaysdropPayment) => void): void;
}

declare global {
    interface Window {
        Waysdrop?: WaysdropGlobal & { __loaded?: boolean };
    }
}

const DEFAULT_HOST = "https://waysdrop.com";

/**
 * Loads the Waysdrop widget and returns controls for it.
 * Safe in SSR (does nothing on the server) and in React StrictMode.
 */
export function useWaysdrop(options: WaysdropWidgetOptions) {
    const [ready, setReady] = useState(false);
    const {
        publicKey,
        profile = "courier",
        country,
        label,
        color,
        position,
    } = options;
    const { launcher = true, host = DEFAULT_HOST } = options;
    const scriptRef = useRef<HTMLScriptElement | null>(null);
    // Keep callbacks fresh without reloading the widget when they change.
    const handlers = useRef({ onPayment: options.onPayment, onClose: options.onClose });
    handlers.current = { onPayment: options.onPayment, onClose: options.onClose };

    useEffect(() => {
        if (typeof document === "undefined" || !publicKey) return;

        const script = document.createElement("script");
        script.src = `${host.replace(/\/$/, "")}/widget.js`;
        script.async = true;
        script.dataset.key = publicKey;
        script.dataset.profile = profile;
        if (country) script.dataset.country = country;
        if (label) script.dataset.label = label;
        if (color) script.dataset.color = color;
        if (position) script.dataset.position = position;
        if (!launcher) script.dataset.launcher = "false";

        script.onload = () => {
            const widget = window.Waysdrop;
            widget?.on("ready", () => setReady(true));
            widget?.on("payment", (p) => handlers.current.onPayment?.(p));
            widget?.on("close", () => handlers.current.onClose?.());
        };

        document.body.appendChild(script);
        scriptRef.current = script;

        return () => {
            setReady(false);
            window.Waysdrop?.destroy();
            script.remove();
            scriptRef.current = null;
        };
    }, [publicKey, profile, country, label, color, position, launcher, host]);

    return {
        ready,
        open: () => window.Waysdrop?.open(),
        close: () => window.Waysdrop?.close(),
    };
}

/** Drop-in component: renders the floating launcher and the widget. */
export function WaysdropWidget(props: WaysdropWidgetOptions) {
    useWaysdrop(props);
    return null;
}
