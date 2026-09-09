# Scripts

Loading third-party scripts in Next.js.

## Use next/script

Prefer `next/script` for executable third-party scripts needing a loading strategy. Native `<script type="application/ld+json">` is appropriate for JSON-LD: serialize trusted structured data and escape `<` as `\u003c` before insertion. Do not add an executable-script dependency for JSON-LD.

```tsx
// Bad: Native script tag
<script src="https://example.com/script.js"></script>

// Good: Next.js Script component
import Script from 'next/script'

<Script src="https://example.com/script.js" />
```

## Inline Scripts Need ID

Inline scripts require an `id` attribute for Next.js to track them.

```tsx
// Bad: Missing id
<Script dangerouslySetInnerHTML={{ __html: 'console.log("hi")' }} />

// Good: Has id
<Script id="my-script" dangerouslySetInnerHTML={{ __html: 'console.log("hi")' }} />

// Good: Inline with id
<Script id="show-banner">
  {`document.getElementById('banner').classList.remove('hidden')`}
</Script>
```

## Don't Put Script in Head

`next/script` should not be placed inside `next/head`. It handles its own positioning.

```tsx
// Bad: Script inside Head
import Head from 'next/head'
import Script from 'next/script'

<Head>
  <Script src="/analytics.js" />
</Head>

// Good: Script outside Head
<Head>
  <title>Page</title>
</Head>
<Script src="/analytics.js" />
```

## Loading Strategies

```tsx
// afterInteractive (default) - Load after page is interactive
<Script src="/analytics.js" strategy="afterInteractive" />

// lazyOnload - Load during idle time
<Script src="/widget.js" strategy="lazyOnload" />

// beforeInteractive - Load before page is interactive (use sparingly)
// Only works in app/layout.tsx or pages/_document.js
<Script src="/critical.js" strategy="beforeInteractive" />

// Pages Router only: experimental worker requires nextScriptWorkers flag.
// Not supported in App Router; do not use this branch there.
<Script src="/heavy.js" strategy="worker" />
```

## Google Analytics

When the chosen analytics integration needs it, verify the installed `@next/third-parties` version and use its supported component. Preserve a working consent-aware integration; examples do not authorize adding analytics.

```tsx
// Bad: Inline GA script
<Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX" />
<Script id="ga-init">
  {`window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXX');`}
</Script>

// Good: Next.js component
import { GoogleAnalytics } from '@next/third-parties/google'

export default function Layout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXX" />
    </html>
  )
}
```

## Google Tag Manager

```tsx
import { GoogleTagManager } from '@next/third-parties/google'

export default function Layout({ children }) {
  return (
    <html>
      <GoogleTagManager gtmId="GTM-XXXXX" />
      <body>{children}</body>
    </html>
  )
}
```

## Other Third-Party Scripts

```tsx
// YouTube embed
import { YouTubeEmbed } from '@next/third-parties/google'

<YouTubeEmbed videoid="dQw4w9WgXcQ" />

// Google Maps
import { GoogleMapsEmbed } from '@next/third-parties/google'

<GoogleMapsEmbed
  apiKey="YOUR_API_KEY"
  mode="place"
  q="Brooklyn+Bridge,New+York,NY"
/>
```

## Quick Reference

| Pattern | Issue | Fix |
|---------|-------|-----|
| Executable third-party script | Loading strategy needed | Prefer `next/script`; native JSON-LD remains valid |
| `<Script>` without id | Can't track inline scripts | Add `id` attribute |
| `<Script>` inside `<Head>` | Wrong placement | Move outside Head |
| Inline GA/GTM scripts | No optimization | Use `@next/third-parties` |
| `strategy="beforeInteractive"` outside layout | Won't work | Only use in root layout |
