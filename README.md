# STASH-API!

This is the api for STASH.
Created using the express-boilerplate.

# Create Database
`createdb -U {username} {database name}`

# Migrations
Run Migrations: `npm run migrate`

# Seed Database
`psql -U {username} -d {database name} -f {path to seed file}`

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Deploying

When your new project is ready for deployment, add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.