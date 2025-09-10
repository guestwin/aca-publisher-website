// Sitemap generation utilities
import fs from 'fs';
import path from 'path';

/**
 * Generate XML sitemap
 * @param {Array} urls - Array of URL objects
 * @returns {string} XML sitemap content
 */
export const generateSitemap = (urls) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${url.images ? url.images.map(img => `
    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:title>${img.title}</image:title>
    </image:image>`).join('') : ''}
  </url>`).join('\n')}
</urlset>`;
  
  return sitemap;
};

/**
 * Generate robots.txt content
 * @param {string} siteUrl - Base site URL
 * @returns {string} Robots.txt content
 */
export const generateRobotsTxt = (siteUrl) => {
  return `User-agent: *
Allow: /

# Disallow admin pages
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /uploads/

# Allow specific API endpoints for SEO
Allow: /api/products
Allow: /api/composers

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1`;
};

/**
 * Get static pages URLs
 * @param {string} baseUrl - Base URL of the site
 * @returns {Array} Array of static page URLs
 */
export const getStaticPages = (baseUrl) => {
  const staticPages = [
    {
      loc: baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      loc: `${baseUrl}/catalog`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      loc: `${baseUrl}/composers`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: `${baseUrl}/national`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${baseUrl}/religious`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${baseUrl}/traditional`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${baseUrl}/search`,
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: '0.6'
    }
  ];
  
  return staticPages;
};

/**
 * Get product pages URLs from database
 * @param {string} baseUrl - Base URL of the site
 * @returns {Promise<Array>} Array of product page URLs
 */
export const getProductPages = async (baseUrl) => {
  try {
    // This would typically fetch from your database
    // For now, we'll use a mock implementation
    const products = [
      { id: 1, title: 'Cantate Domino', updatedAt: '2024-01-15' },
      { id: 2, title: 'Panorama Nusantara', updatedAt: '2024-01-10' },
      { id: 3, title: 'Wayang Kulit', updatedAt: '2024-01-05' }
    ];
    
    return products.map(product => ({
      loc: `${baseUrl}/product/${product.id}`,
      lastmod: new Date(product.updatedAt).toISOString(),
      changefreq: 'monthly',
      priority: '0.8',
      images: [
        {
          loc: `${baseUrl}/scores/${product.title.toLowerCase().replace(/\s+/g, '-')}.svg`,
          title: product.title
        }
      ]
    }));
  } catch (error) {
    console.error('Error fetching product pages:', error);
    return [];
  }
};

/**
 * Get composer pages URLs from database
 * @param {string} baseUrl - Base URL of the site
 * @returns {Promise<Array>} Array of composer page URLs
 */
export const getComposerPages = async (baseUrl) => {
  try {
    // Mock implementation - replace with actual database query
    const composers = [
      { id: 1, name: 'Joseph Kristanto Pantioso', updatedAt: '2024-01-12' },
      { id: 2, name: 'Milton Sandyka', updatedAt: '2024-01-08' }
    ];
    
    return composers.map(composer => ({
      loc: `${baseUrl}/composer/${composer.id}`,
      lastmod: new Date(composer.updatedAt).toISOString(),
      changefreq: 'monthly',
      priority: '0.7'
    }));
  } catch (error) {
    console.error('Error fetching composer pages:', error);
    return [];
  }
};

/**
 * Generate complete sitemap with all pages
 * @param {string} baseUrl - Base URL of the site
 * @returns {Promise<string>} Complete XML sitemap
 */
export const generateCompleteSitemap = async (baseUrl) => {
  try {
    const staticPages = getStaticPages(baseUrl);
    const productPages = await getProductPages(baseUrl);
    const composerPages = await getComposerPages(baseUrl);
    
    const allPages = [...staticPages, ...productPages, ...composerPages];
    
    return generateSitemap(allPages);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return generateSitemap(getStaticPages(baseUrl));
  }
};

/**
 * Save sitemap to public directory
 * @param {string} sitemapContent - XML sitemap content
 * @param {string} publicDir - Public directory path
 */
export const saveSitemap = (sitemapContent, publicDir = './public') => {
  try {
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
    console.log('Sitemap saved successfully to:', sitemapPath);
  } catch (error) {
    console.error('Error saving sitemap:', error);
  }
};

/**
 * Save robots.txt to public directory
 * @param {string} robotsContent - Robots.txt content
 * @param {string} publicDir - Public directory path
 */
export const saveRobotsTxt = (robotsContent, publicDir = './public') => {
  try {
    const robotsPath = path.join(publicDir, 'robots.txt');
    fs.writeFileSync(robotsPath, robotsContent, 'utf8');
    console.log('Robots.txt saved successfully to:', robotsPath);
  } catch (error) {
    console.error('Error saving robots.txt:', error);
  }
};

/**
 * Generate and save both sitemap and robots.txt
 * @param {string} baseUrl - Base URL of the site
 * @param {string} publicDir - Public directory path
 */
export const generateSEOFiles = async (baseUrl, publicDir = './public') => {
  try {
    console.log('Generating SEO files...');
    
    // Generate and save sitemap
    const sitemapContent = await generateCompleteSitemap(baseUrl);
    saveSitemap(sitemapContent, publicDir);
    
    // Generate and save robots.txt
    const robotsContent = generateRobotsTxt(baseUrl);
    saveRobotsTxt(robotsContent, publicDir);
    
    console.log('SEO files generated successfully!');
  } catch (error) {
    console.error('Error generating SEO files:', error);
  }
};

/**
 * Validate sitemap XML
 * @param {string} sitemapContent - XML sitemap content
 * @returns {Object} Validation result
 */
export const validateSitemap = (sitemapContent) => {
  const errors = [];
  const warnings = [];
  
  // Basic XML validation
  if (!sitemapContent.includes('<?xml version="1.0"')) {
    errors.push('Missing XML declaration');
  }
  
  if (!sitemapContent.includes('<urlset')) {
    errors.push('Missing urlset element');
  }
  
  // Count URLs
  const urlMatches = sitemapContent.match(/<url>/g);
  const urlCount = urlMatches ? urlMatches.length : 0;
  
  if (urlCount === 0) {
    errors.push('No URLs found in sitemap');
  } else if (urlCount > 50000) {
    warnings.push('Sitemap contains more than 50,000 URLs - consider splitting');
  }
  
  // Check for required elements
  if (!sitemapContent.includes('<loc>')) {
    errors.push('Missing loc elements');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    urlCount
  };
};

export default {
  generateSitemap,
  generateRobotsTxt,
  getStaticPages,
  getProductPages,
  getComposerPages,
  generateCompleteSitemap,
  saveSitemap,
  saveRobotsTxt,
  generateSEOFiles,
  validateSitemap
};