const knex = require('knex')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const helpers = require('./test-helpers')
const { expect } = require('chai')
const { expectCt } = require('helmet')
const supertest = require('supertest')

describe(`Users Endpoints`, () => {
    let db

    const { 
        testUsers,
        testRecipes,
        testMeals
     } = helpers.makeRecipesFixtures()
    const testUser = testUsers[0]

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    describe(`GET /api/users`, () => {
        context('Given no users', () => {

            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/users')
                    .set(`Authorization`, helpers.makeAuthHeader(testUser))
                    .expect(200, [])
            })
        })

        context('Given there are users', () => {
            beforeEach('insert users', () => {
                return db
                    .into('users')
                    .insert(testUsers)
            })

            it('responds with 200 and all of the recipes', () => {
                return supertest(app)
                    .get('/api/users')
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].username).to.eql(testUsers[0].username)
                        expect(res.body[0].firstname).to.eql(testUsers[0].firstname)
                        expect(res.body[0].lastname).to.eql(testUsers[0].lastname)
                    })
            })
        })
    })

    describe(`GET /api/users/:id`, () => {
        context('Given no users', () => {
            it('responds with 404', () => {
                const userId = 1234
                return supertest(app)
                    .get(`/api/users/${userId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(404, { error: `User doesn't exist` })
            })
        })

        context('Given there are users', () => {
            beforeEach('insert users', () => {
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

            it('responds with 200 and the specified user', () => {
                const userId = 2
                const expectedUser = testUsers.find(user => user.id === userId)
                return supertest(app)
                    .get(`/api/users/${userId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUser))
                    .expect(200)
                    .expect(res => {
                        // console.log(`RES`, res.body)
                        expect(res.body.username).to.eql(expectedUser.username)
                        expect(res.body.firstname).to.eql(expectedUser.firstname)
                        expect(res.body.lastname).to.eql(expectedUser.lastname)
                        expect(res.body).to.have.property('recipes')
                        expect(res.body).to.have.property('meals')
                    })
            })

        })
    })

    describe(`POST /api/users`, () => {
        context(`User Validations`, () => {
            beforeEach('insert users', () => {
                return db
                    .into('users')
                    .insert(testUsers)
            })

            const requiredFields = ['username', 'password']

            requiredFields.forEach(field => {
                const registerAttemptBody = {
                    username: 'test username',
                    password: 'test password',
                    firstname: 'test firstname',
                    lastname: 'test lastname'
                }

                it(`responds with 400 required error when '${field}' is missing`, () => {
                    delete registerAttemptBody[field]

                    return supertest(app)
                        .post('/api/users')
                        .send(registerAttemptBody)
                        .expect(400, { error: `Missing '${field}' in request body` })
                })

                it(`responds 400 'Password must be longer than 8 characters' when empty password`, () => {
                    const userShortPassword = {
                        username: 'test username',
                        password: '1234567', 
                        firstname: 'test firstname',
                        lastname: 'test lastname'
                    }
                    return supertest(app)
                        .post(`/api/users`)
                        .send(userShortPassword)
                        .expect(400, { error: `Password must be longer than 8 characters` })
                })

                it(`responds 400 'Password must be less than 72 characters' when long password`, () => {
                    const userLongPassword = {
                        username: 'test username',
                        password: '*'.repeat(73),
                        firstname: 'test firstname',
                        lastname: 'test lastname'
                    }
                  
                    return supertest(app)
                        .post('/api/users')
                        .send(userLongPassword)
                        .expect(400, {error: `Password must be less than 72 characters`})
                })

                it(`responds 400 error when password starts with spaces`, () => {
                    const userPasswordStartsSpaces = {
                        username: 'test username',
                        password: ' 1Aa!2Bb@',
                        firstname: 'test firstname',
                        lastname: 'test lastname'
                    }
                    return supertest(app)
                        .post('/api/users')
                        .send(userPasswordStartsSpaces)
                        .expect(400, { error: `Password must not start or end with spaces`})
                })

                it(`responds 400 error when password ends with spaces`, () => {
                    const userPasswordStartsSpaces = {
                        username: 'test username',
                        password: '1Aa!2Bb@ ',
                        firstname: 'test firstname',
                        lastname: 'test lastname'
                    }
                    return supertest(app)
                        .post('/api/users')
                        .send(userPasswordStartsSpaces)
                        .expect(400, { error: `Password must not start or end with spaces`})
                })

                it(`responds 400 error when password isn't complex enough`, () => {
                    const userPasswordNotComplex = {
                        username: 'test username',
                        password: '11AAaabb',
                        firstname: 'test firstname',
                        lastname: 'test lastname'
                    }
                    return supertest(app)
                        .post('/api/users')
                        .send(userPasswordNotComplex)
                        .expect(400, { error: `Password must contain 1 upper case, lower case, number and special character`})
                })

                it(`responds 400 'Username already taken' when username isn't unique`, () => {
                    const duplicateUser = {
                        username: testUser.username,
                        password: '11AAaa!!',
                        firstname: 'test firstname',
                        lastname: 'test lastname'
                    }
                    return supertest(app)
                        .post('/api/users')
                        .send(duplicateUser)
                        .expect(400, { error: `Username already taken` })
                })
            })
        })

        context(`Happy path`, () => {
            it(`responds 201, serialized user, storing bcrypted password`, () => {
                const newUser = {
                    username: 'test username',
                    password: '11AAaa!!',
                    firstname: 'testuser firstname',
                    lastname: 'testuser lastname'
                }
                
                return supertest(app)
                    .post('/api/users')
                    .send(newUser)
                    .expect(201)
                    .expect(res => {
                        console.log(`RES`, res.body)
                        expect(res.body).to.have.property('authToken')
                        // expect(res.body.username).to.eql(newUser.username)
                        // expect(res.body.firstname).to.eql(newUser.firstname)
                        // expect(res.body.lastname).to.eql(newUser.lastname)
                        // expect(res.body).to.not.have.property('password')
                        // expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
                        // const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC'})
                        // const actualDate = new Date(res.body.date_created).toLocaleString()
                        // expect(actualDate).to.eql(expectedDate)
                    })
                    .expect(res =>
                        db
                            .from('users')
                            .select('*')
                            .where({ id: res.body.id })
                            .first()
                            .then(row => {
                                expect(row.username).to.eql(newUser.username)
                                expect(row.firstname).to.eql(newUser.firstname)
                                expect(row.lastname).to.eql(newUser.lastname)
                                const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                                const actualDate = new Date(row.date_created).toLocaleString()
                                expect(actualDate).to.eql(expectedDate)

                                return bcrypt.compare(newUser.password, row.password)
                            })
                            .then(compareMatch => {
                                expect(compareMatch).to.be.true
                            })
                    )
            })
        })
    })

    describe(`DELETE /api/users/:id`, () => {
        context('Given no users', () => {
            it('responds with 404', () => {
                const userId = 12345
                return supertest(app)
                    .delete(`/api/users/${userId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUser))
                    .expect(404, { error: `User doesn't exist` })
            })
        })

        context('Given there are users', () => {
            beforeEach('insert users with recipes and meals', () => {
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

            it('responds with 204 and removes the user', () => {
                const idToRemove = 1
                const expectedUsers = testUsers.filter(user => user.id !== idToRemove)

                return supertest(app)
                    .delete(`/api/users/${idToRemove}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUser))
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/users`)
                            .set(`Authorization`, helpers.makeAuthHeader(testUser))
                            .expect(expectedUsers)

                    })
            })
        })
    })
})