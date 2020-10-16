const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')


describe(`Protected endpoints`, () => {
    let db

    const {
      testUsers,
      testRecipes,
      testMeals,
    } = helpers.makeRecipesFixtures()

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })
    
    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    beforeEach('', () => {
        return db
            .into('users')
            .insert(testUsers)
            .then(() => {
                return db
                    .into('recipes')
                    .insert(testRecipes)
                    .then(() => {
                        return db
                            .into('meals')
                            .insert(testMeals)
                    })
            })
    })

    const protectedEndpoints = [
        {
            name: 'GET /api/recipes',
            path: '/api/recipes/',
            method: supertest(app).get
        },
        {
            name: 'GET /api/recipes/user',
            path: '/api/recipes/user',
            method: supertest(app).get
        },
        { 
            name: 'GET /api/recipes/:id',
            path: '/api/recipes/1',
            method: supertest(app).get
        },
        {
            name: 'POST /api/recipes',
            path: '/api/recipes',
            method: supertest(app).post
        },
        {
            name: 'PATCH /api/recipes/:id',
            path: '/api/recipes/1',
            method: supertest(app).patch
        },
        {
            name: 'DELETE /api/recipes/:id',
            path: '/api/recipes/1',
            method: supertest(app).delete
        },
        {
            name: 'GET /api/meals',
            path: '/api/meals/',
            method: supertest(app).get
        },
        {
            name: 'GET /api/meals/user',
            path: '/api/meals/user',
            method: supertest(app).get
        },
        {
            name: 'GET /api/meals/:id',
            path: '/api/meals/1',
            method: supertest(app).get
        },
        {
            name: 'POST /api/meals',
            path: '/api/meals/',
            method: supertest(app).post
        },
        {
            name: 'DELETE /api/meals/:id',
            path: '/api/meals/1',
            method: supertest(app).delete
        },
    ]

    protectedEndpoints.forEach(endpoint => {
      describe(endpoint.name, () => {
        it(`responds with 401 'Missing bearer token' when no bearer token`, () => {
          return endpoint.method(endpoint.path)
            .expect(401, { error: `Missing bearer token` })
        })

        it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
          const validUser = testUsers[0]
          const invalidSecret = 'bad-secret'
          return endpoint.method(endpoint.path)
            .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
            .expect(401, { error: `Unauthorized request` })
        })

        it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
          const invalidUser = { username: 'user-not-existy', id: 1 }
          return endpoint.method(endpoint.path)
            .set('Authorization', helpers.makeAuthHeader(invalidUser))
            .expect(401, { error: `Unauthorized request` })
        })
      })
    })
  })