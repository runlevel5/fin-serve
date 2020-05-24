process.env.PORT = 9000;
process.env.CONTENT_SECURITY_POLICY = "frame-ancestors 'self'";

require('must'); //eslint-disable-line
require('../www');
