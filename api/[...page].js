const fs = require('fs');
const path = require('path');

// Map URL paths to HTML files
const pageMap = {
  '': 'index.html',
  '/': 'index.html',
  'about': 'about.html',
  'services': 'services.html',
  'service': 'service.html',
  'projects': 'projects.html',
  'project': 'project.html',
  'contacts': 'contacts.html',
  'founder': 'founder.html',
};

module.exports = async function handler(req, res) {
  try {
    // Get the path
    let pathKey = req.url.split('?')[0].replace(/^\//, '').split('/')[0];
    
    // If root, use index
    if (!pathKey || pathKey === '' || req.url === '/') {
      pathKey = '';
    }

    // Get the file
    const htmlFile = pageMap[pathKey] || 'index.html';
    const filePath = path.join(process.cwd(), htmlFile);

    // Read file
    if (!fs.existsSync(filePath)) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title></head>
        <body><h1>404 - Page Not Found</h1></body>
        </html>
      `);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    return res.send(content);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
};
