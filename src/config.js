module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_ORIGIN: 'http://localhost:3000' || 'https://stash.staysee.vercel.app/',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql:stash_admin@localhost/stash',
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql:stash_admin@localhost/stash-test',
    JWT_SECRET: process.env.JWT_SECRET || 'secret-stash-secret'
}