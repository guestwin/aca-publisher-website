import Head from 'next/head';

// Organization structured data
export const OrganizationStructuredData = ({ organization }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": organization.name || "ACA Publisher",
    "url": organization.url || "https://acapubweb.com",
    "logo": organization.logo || "https://acapubweb.com/logo-1757397256744.png",
    "description": organization.description || "Premium sheet music and choral arrangements from talented Indonesian composers",
    "foundingDate": organization.foundingDate,
    "founder": organization.founder,
    "address": organization.address && {
      "@type": "PostalAddress",
      "streetAddress": organization.address.street,
      "addressLocality": organization.address.city,
      "addressRegion": organization.address.region,
      "postalCode": organization.address.postalCode,
      "addressCountry": organization.address.country || "ID"
    },
    "contactPoint": organization.contact && {
      "@type": "ContactPoint",
      "telephone": organization.contact.phone,
      "contactType": "customer service",
      "email": organization.contact.email
    },
    "sameAs": organization.socialMedia || []
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
};

// Music composition structured data
export const MusicCompositionStructuredData = ({ composition }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    "name": composition.title,
    "description": composition.description,
    "composer": {
      "@type": "Person",
      "name": composition.composer.name,
      "nationality": composition.composer.nationality || "Indonesian"
    },
    "dateCreated": composition.dateCreated,
    "genre": composition.genre,
    "inLanguage": composition.language || "id",
    "musicArrangement": composition.arrangement && {
      "@type": "MusicArrangement",
      "name": composition.arrangement.name,
      "arranger": {
        "@type": "Person",
        "name": composition.arrangement.arranger
      }
    },
    "offers": {
      "@type": "Offer",
      "price": composition.price,
      "priceCurrency": composition.currency || "IDR",
      "availability": "https://schema.org/InStock",
      "url": composition.url
    },
    "aggregateRating": composition.rating && {
      "@type": "AggregateRating",
      "ratingValue": composition.rating.value,
      "reviewCount": composition.rating.count,
      "bestRating": 5,
      "worstRating": 1
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
};

// Website structured data
export const WebsiteStructuredData = ({ website }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": website.name || "ACA Publisher",
    "url": website.url || "https://acapubweb.com",
    "description": website.description || "Premium sheet music and choral arrangements",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${website.url || 'https://acapubweb.com'}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": website.publisher || "ACA Publisher",
      "logo": website.logo || "https://acapubweb.com/logo-1757397256744.png"
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
};

// Breadcrumb structured data
export const BreadcrumbStructuredData = ({ breadcrumbs }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
};

// FAQ structured data
export const FAQStructuredData = ({ faqs }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
};

// Collection/Catalog structured data
export const CollectionStructuredData = ({ collection }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": collection.name,
    "description": collection.description,
    "url": collection.url,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": collection.itemCount,
      "itemListElement": collection.items?.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": item.url,
        "name": item.name
      })) || []
    },
    "breadcrumb": collection.breadcrumbs && {
      "@type": "BreadcrumbList",
      "itemListElement": collection.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
};

export default {
  OrganizationStructuredData,
  MusicCompositionStructuredData,
  WebsiteStructuredData,
  BreadcrumbStructuredData,
  FAQStructuredData,
  CollectionStructuredData
};