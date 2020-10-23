const knex = require('knex')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const helpers = require('./test-helpers')
const authRouter = require('../src/auth/auth-router')
const supertest = require('supertest')

describe('Auth Endpoints', function () {

    const testUser = {
        username: 'janedoe',
        password: 'password1'
    }

    const db = knex({
        client: 'pg',
        connection: process.env.DATABASE_URL
    })
    app.set('db', db)

    const request = supertest(app)

    before(async () => {
        await helpers.initiateDatabase()
    })

    after(async () => {
        await helpers.destroyDatabase()
    })


    describe(`POST /api/auth/login`, () => {
        const requiredFields = ['username', 'password']

        requiredFields.forEach(field => {
            const loginAttemptBody = {
                username: testUser.username,
                password: testUser.password
            }

            it(`responds with 400 required error when '${field}' is missing`, () => {
                delete loginAttemptBody[field]
                
                return request
                    .post('/api/auth/login')
                    .send(loginAttemptBody)
                    .expect(400, {
                        error: `Missing '${field}' in request body`
                    })
            })

            it(`responds 401 'invalid username or password' when bad username`, () => {
                const userInvalidUser = { username: 'user-not', password: 'existy' }
                return request
                    .post('/api/auth/login')
                    .send(userInvalidUser)
                    .expect(401, {
                        error: `Incorrect username or password`
                    })
            })

            it(`responds 401 'invalid username or password' when bad password`, () => {
                const userInvalidPass = { username: testUser.username, password: 'incorrect' }
                return request
                    .post('/api/auth/login')
                    .send(userInvalidPass)
                    .expect(401, { error: `Incorrect username or password` })
            })

            it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
                const userValidCreds = {
                    username: testUser.username,
                    password: testUser.password
                }
                return request
                    .post('/api/auth/login')
                    .send(userValidCreds)
                    .expect(200)
                    .then( res => {
                        expect(res.body.authToken).to.not.eql(null)
                    })
            })
        })
    })
})