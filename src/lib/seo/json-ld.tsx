export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "OscarPoolVibes",
        url: "https://oscarpoolvibes.com",
        description: "Create and manage Oscar prediction pools with friends",
        applicationCategory: "Entertainment",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "Organization",
        name: "OscarPoolVibes",
        url: "https://oscarpoolvibes.com",
      },
    ],
  };

  // Safe: jsonLd is a hardcoded object with no user input
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
