// Same server, without the legacy HTML frontend or browser redirects.
process.env.API_ONLY = '1';
require('../index');
