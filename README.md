# @waysdrop/widget-react

React bindings for the embeddable Waysdrop widget.

```bash
npm i @waysdrop/widget-react
```

```tsx
import { WaysdropWidget } from "@waysdrop/widget-react";

export default function App() {
    return <WaysdropWidget publicKey="wsp_pub_live_..." profile="courier" />;
}
```

Use your own button:

```tsx
import { useWaysdrop } from "@waysdrop/widget-react";

function SendButton() {
    const { open } = useWaysdrop({
        publicKey: "wsp_pub_live_...",
        launcher: false,
    });
    return <button onClick={open}>Send a package</button>;
}
```

React to payments:

```tsx
<WaysdropWidget
    publicKey="wsp_pub_live_..."
    onPayment={(p) =>
        p.final && p.status === "SUCCESS" && console.log(p.trackingId)
    }
/>
```

Only **public** keys (`wsp_pub_...`) belong in the browser. Restrict the key to your
site's origins in the Waysdrop dashboard.

## Display currency

Prices are shown in the visitor's local currency, detected from their location.
To force one, pass an ISO country code:

```tsx
<WaysdropWidget publicKey="wsp_pub_live_..." country="NG" />
```

In plain HTML use `data-country="NG"` on the script tag.
