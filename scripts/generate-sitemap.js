const fs = require('fs');

const BASE_URL = 'https://ctype.kr';
const PUBLIC_DIR = './public';

async function generateSitemap() {
  try {
    const staticPages = [
      { url: '/', lastmod: new Date().toISOString().split('T')[0], priority: '1.0' },
      { url: '/login', lastmod: new Date().toISOString().split('T')[0], priority: '0.8' }
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <priority>${page.priority}</priority>
  </url>\n`;
    });

    // 시 페이지 하드코딩 생성 (1~20)
    for (let i = 1; i <= 20; i++) {
      const paddedId = String(i);
      sitemap += `  <url>
    <loc>${BASE_URL}/poem/${paddedId}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.7</priority>
  </url>\n`;
    }

    sitemap += `</urlset>`;

    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR);
    }

    fs.writeFileSync(`${PUBLIC_DIR}/sitemap.xml`, sitemap);
    console.log('✅ 사이트맵 생성 완료!');

  } catch (error) {
    console.error('사이트맵 생성 중 오류:', error);
  }
}

generateSitemap();
