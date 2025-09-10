import Head from 'next/head';
import { useRouter } from 'next/router';

const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  noindex = false,
  nofollow = false,
  canonical,
  structuredData,
  ...props
}) => {
  const router = useRouter();
  
  // Default values
  const siteUrl = process.env.NEXTAUTH_URL || 'https://acapubweb.com';
  const defaultTitle = 'ACA Publisher - Premium Sheet Music & Choral Arrangements';
  const defaultDescription = 'Discover premium sheet music and choral arrangements from talented Indonesian composers. Download high-quality PDF scores for your choir, orchestra, or solo performance.';
  const defaultImage = `${siteUrl}/piano-logo.svg`;
  const defaultKeywords = 'sheet music, choral arrangements, Indonesian composers, PDF scores, music download, choir music, classical music, traditional music, religious music';
  
  // Construct final values
  const finalTitle = title ? `${title} | ACA Publisher` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalUrl = url || `${siteUrl}${router.asPath}`;
  const finalImage = image || defaultImage;
  const finalKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;
  
  // Robots meta
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');
  
  // Generate structured data
  const generateStructuredData = () => {
    if (structuredData) {
      return structuredData;
    }
    
    // Default organization schema
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ACA Publisher',
      url: siteUrl,
      logo: `${siteUrl}/piano-logo.svg`,
      description: defaultDescription,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'info@acapublisher.com'
      },
      sameAs: [
        'https://www.facebook.com/acapublisher',
        'https://www.instagram.com/acapublisher',
        'https://www.youtube.com/acapublisher'
      ]
    };
    
    // Website schema
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ACA Publisher',
      url: siteUrl,
      description: defaultDescription,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
    
    return [organizationSchema, websiteSchema];
  };
  
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={author || 'ACA Publisher'} />
      <meta name="robots" content={robotsContent} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Indonesian" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || finalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:site_name" content="ACA Publisher" />
      <meta property="og:locale" content="id_ID" />
      
      {/* Article specific Open Graph */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags && tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@acapublisher" />
      <meta name="twitter:creator" content="@acapublisher" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#1f2937" />
      <meta name="msapplication-TileColor" content="#1f2937" />
      <meta name="application-name" content="ACA Publisher" />
      <meta name="apple-mobile-web-app-title" content="ACA Publisher" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/svg+xml" href="/piano-logo.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      
      {/* Structured Data */}
      {generateStructuredData().map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
          }}
        />
      ))}
      
      {/* Additional custom props */}
      {Object.entries(props).map(([key, value]) => {
        if (key.startsWith('meta:')) {
          const metaName = key.replace('meta:', '');
          return <meta key={key} name={metaName} content={value} />;
        }
        if (key.startsWith('og:')) {
          return <meta key={key} property={key} content={value} />;
        }
        return null;
      })}
    </Head>
  );
};

// Specific SEO components for different page types
export const ProductSEO = ({ product }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: 'ACA Publisher'
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IDR',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'ACA Publisher'
      }
    },
    aggregateRating: product.rating && {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count
    }
  };
  
  return (
    <SEO
      title={product.title}
      description={product.description}
      image={product.image}
      type="product"
      structuredData={structuredData}
      keywords={`${product.title}, ${product.composer}, sheet music, choral arrangement`}
    />
  );
};

export const ComposerSEO = ({ composer }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: composer.name,
    description: composer.bio,
    image: composer.foto,
    jobTitle: 'Composer',
    worksFor: {
      '@type': 'Organization',
      name: 'ACA Publisher'
    },
    sameAs: composer.socialLinks || []
  };
  
  return (
    <SEO
      title={`${composer.name} - Composer`}
      description={composer.bio}
      image={composer.foto}
      type="profile"
      structuredData={structuredData}
      keywords={`${composer.name}, composer, Indonesian music, choral arrangements`}
    />
  );
};

export const CategorySEO = ({ category, products }) => {
  const categoryTitles = {
    national: 'National Songs',
    religious: 'Religious Music',
    traditional: 'Traditional Music'
  };
  
  const categoryDescriptions = {
    national: 'Discover beautiful arrangements of Indonesian national songs and patriotic music for choir and orchestra.',
    religious: 'Explore our collection of sacred music, hymns, and religious choral arrangements.',
    traditional: 'Traditional Indonesian folk songs arranged for modern choral performances.'
  };
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryTitles[category],
    description: categoryDescriptions[category],
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products?.length || 0,
      itemListElement: products?.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.title,
          url: `/product/${product.id}`
        }
      })) || []
    }
  };
  
  return (
    <SEO
      title={categoryTitles[category]}
      description={categoryDescriptions[category]}
      structuredData={structuredData}
      keywords={`${category} music, Indonesian ${category} songs, choral arrangements`}
    />
  );
};

export default SEO;