// Google tag ID supplied by the GA4 web data stream.
const tagId = 'GTM-P54692MZ';

if (tagId && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${tagId}`;
  document.head.append(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
}
