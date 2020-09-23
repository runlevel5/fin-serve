#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');

const {
  STATIC_DIR = 'dist',
  HOST_PORT = process.env.PORT || 80,
  API_URL = 'http://localhost:3005',
  CONTENT_SECURITY_POLICY = ''
} = process.env;

const metaTags = Object.keys(process.env).reduce((env, name) =>
  name.startsWith('META_TAG_') ? Object.assign(env, {
    [name.replace(/^META_TAG_/, '')]: process.env[name]
  }) : env
, { API_URL });

const metaString = Object.keys(metaTags).map(name =>
  `<meta name="${name}" content="${metaTags[name]}">`
).join('\n  ');

const normalIndex = fs.readFileSync(`${STATIC_DIR}/index.html`, 'utf8');
const metaAmmendedIndex = !normalIndex ? '' :
  normalIndex.split('\n').reduce((full, line) => {
    full += `${line}\n`;
    if (line.includes('<head>')) full += `  ${metaString}\n`;
    return full;
  }, '');

const serve = serveStatic(STATIC_DIR);
console.log('Serving your files now!');

const ONE_MONTH = 2628000;
const MD5_HASHED_RESOURCE = /-[a-f0-9]{20,32}\.(js|css|jpg|svg|ico|eot|ttf|woff|woff2)(\?|$)/i;

const setCaching = (req, res) => {
  if (MD5_HASHED_RESOURCE.test(req.url)) {
    res.setHeader('Cache-Control', `public, max-age=${ONE_MONTH}`);
  }
};

const setCSP = (res) => {
  if (CONTENT_SECURITY_POLICY !== '') {
    res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  }
};

const ASSET_PATH_RE = /\.(html|css$|js$|json|webapp|cache|jpg|svg|png|ico|txt|eot|ttf|woff|woff2)/;

const server = http.createServer((req, res) => {
  if (req.url === '/_health/ready' || req.url === '/_health/alive') {
    res.end('OK');
    return;
  }
  setCSP(res);
  if (!ASSET_PATH_RE.test(req.url)) {
    req.url = '/';

    /*
     * Disable caching of our html pages
     * These should always update so if our js has changed it will fetch the new bundler
     *
     * http://cristian.sulea.net/blog/disable-browser-caching-with-meta-html-tags/
     */
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.end(metaAmmendedIndex);
  } else {
    setCaching(req, res);
    serve(req, res, finalhandler(req, res));
  }
});

server.listen(HOST_PORT);
