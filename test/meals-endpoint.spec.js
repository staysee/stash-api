const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const supertest = require('supertest')
const { makeMealsArray } = require('./meals.fixtures')
const { makeUsersArray } = require('./users.fixtures')

describe.only('Meals Endpoints', function() {
    let db

    //create knex instance to connect to test DB
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

    describe(`GET /api/meals`, () => {
        context('Given no meals', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/meals')
                    .expect(200, [])
            })
        })

        context('Given there are recipes in the database', () => {
            const testUsers = makeUsersArray()
            const testMeals = makeMealsArray()
    
            beforeEach('insert meals', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('meals')
                            .insert(testMeals)
                    })
            })
    
            it('responds with 200 and all of the meals', () => {
                return supertest(app)
                    .get('/api/meals')
                    .expect(200, testMeals)
            })
        })
    })

    describe(`GET /api/meals/:id`, () => {
        context('Given no meals', () => {
            it('responds with 404', () => {
                const mealId = 123
                return supertest(app)
                    .get(`/api/meals/${mealId}`)
                    .expect(404, { error: { message: `Meal doesn't exist` } })
            })
        })

        context(`Given there are meals in the database`, () => {
            const testUsers = makeUsersArray()
            const testMeals = makeMealsArray()

            beforeEach('insert meals', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('meals')
                            .insert(testMeals)
                    })
            })

            it('responds with 200 and the specified meal', () => {
                const mealId = 2
                const expectedMeal = testMeals[mealId - 1]
                return supertest(app)
                    .get(`/api/meals/${mealId}`)
                    .expect(200, expectedMeal)
            })
        })
    })

    describe(`POST /api/meals`, () => {
        const testUsers = makeUsersArray()
        beforeEach('insert malicious meal', () => {
            return db
                .into('users')
                .insert(testUsers)
        })

        it('creates a meal, responding with 201 and the new meal', () => {
            this.retries(3)
            const newMeal = {
                day: 'Thursday',
                recipe_id: 2
            }

            return supertest(app)
                .post('/api/meals')
                .send(newMeal)
                .expect(201)
                .expect( res => {
                    expect(res.body.day).to.eql(newMeal.day)
                    expect(res.body.recipe_id).to.eql(newMeal.recipe_id)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/meals/${res.body.id}`)
                })
                //make second request to the GET /meals/:id
                .then(postRes =>
                    supertest(app)
                    .get(`/api/meals/${postRes.body.id}`)
                    .expect(postRes.body)
                )
        })

        const requiredFields = ['day', 'recipe_id']
        
        requiredFields.forEach(field => {
            const newRecipe = {
                day: 'Thursday',
                recipe_id: 2
            }

            it(`responds with 400 and an error message when a field is missing`, () => {
                delete newMeal[field]
    
                return supertest(app)
                    .post('/api/meals')
                    .send(newMeal)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe(`DELETE /api/meals/:id`, () => {
        context('Given no meals', () => {
            it(`responds with 404`, () => {
                const mealId = 123
                return supertest(app)
                    .delete(`/api/meals/${mealId}`)
                    .expect(404, { error: { message: `Meal doesn't exist` } })
            })
        })
        context('Given there are meals in the database', () => {
            const testUsers = makeUsersArray()
            const testMeals = makeMealsArray()

            beforeEach('insert meals', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('meals')
                            .insert(testMeals)
                    })
            })

            it('responds with 204 and removes the meals', () => {
                const idToRemove = 2
                const expectedMeals = testMeals.filter(meal => meal.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/meals/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/meals`)
                        .expect(expectedMeals)
                    )
            })
        })
    })
})