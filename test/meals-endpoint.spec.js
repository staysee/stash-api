const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const helpers = require('./test-helpers')


describe(` Meals Endpoints`, () => {
    let db

    const { 
        testUsers, 
        testRecipes, 
        testMeals } = helpers.makeRecipesFixtures()
    
    const testUser = testUsers[0]

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())
    before('clean the table', () => db('meals').truncate())
    
    afterEach('cleanup', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    describe(`GET /api/meals`, () => {
        context('Given no meals', () => {
            beforeEach('insert meals', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('recipes')
                            .insert(testRecipes)
                    })
            })
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/meals')
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, {})
            })
        })
        context(`Given there are meals in the database`, () => {
            const mealsOutput = helpers.makeMealsObject()
            
            beforeEach('insert meals', () => {
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
            it(`responds with 200 and all of the meals`, () => {
                return supertest(app)
                    .get(`/api/meals`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, mealsOutput)
            })
        })
    })

    describe(`GET /api/meals/user`, () => {
        context('Given no user meals', () => {
            beforeEach('insert users', () => {
                return db
                    .into('users')
                    .insert(testUsers)
            })

            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/meals/user')
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, {})
            })
        })

        context(`Given user has meals`, () => {
            const mealsOutput = helpers.makeMealsObject()
            beforeEach('insert user, recipes, meals', () => {
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

            it(`responds with 200 and all the user meals`, () => {
                return supertest(app)
                    .get(`/api/meals/user`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .expect(res => {
                        db
                            .from('meals')
                            .select('*')
                            .where({user_id: testUsers[0].id})
                            .first()
                            .then( row => {
                                expect(row.user_id).to.eql(testUsers[0].id)
                            })
                    })

            })
        })
    })

    describe(`GET /api/meals/:id`, () => {
        context('Given no meals', () => {
            beforeEach('insert meals', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('recipes')
                            .insert(testRecipes)
                    })
            })       

            it('responds with 404', () => {
                const mealId = 123
                return supertest(app)
                    .get(`/api/meals/${mealId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Meal doesn't exist` } })
            })
        })
        context('Given there are meals in the database', () => {                
            beforeEach('insert meals', () => {
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
            it ('responds with 200 and the specified meal', () => {
                const mealId = 2
                const expectedMeal = testMeals[mealId - 1]
                return supertest(app)
                    .get(`/api/meals/${mealId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedMeal)
            })
        })
    })

    describe(`POST /api/meals`, () => {
        before('insert users and recipes', () => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('recipes')
                        .insert(testRecipes)
                })
        })

        it ('creates a meal, responding with 201 and the new meal', () => {
            const newMeal = {
                day: 'Saturday',
                recipe_id: 2
            }

            return supertest(app)
                .post('/api/meals')
                .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                .send(newMeal)
                .expect(201)
                .expect(res => {
                    expect(res.body.day).to.eql(newMeal.day)
                    expect(res.body.recipe_id).to.eql(newMeal.recipe_id)
                    expect(res.body.user_id).to.eql(testUser.id)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/meals/${res.body.id}`)
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/api/meals/${postRes.body.id}`)
                        .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                        .expect(postRes.body)
                )
        })

        const requiredFields = ['day', 'recipe_id']

        requiredFields.forEach(field => {
            const newMeal = {
                day: 'Test title',
                recipe_id: 1
            }

            it(`responds with 400 and an error message when '${field}' is missing`, () => {
                delete newMeal[field]

                return supertest(app)
                    .post('/api/meals')
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .send(newMeal)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe(`DELETE /api/meals/:id`, () => {
        context('Given no meals', () => {
            beforeEach('insert recipes', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('recipes')
                            .insert(testRecipes)
                    })
            })
            it(`responds with 404`, () => {
                const mealId = 10
                return supertest(app)
                    .delete(`/api/meals/${mealId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Meal doesn't exist` } })
            })
        })
        context('Given there are meals in the database', () => {
            const mealsOutput = helpers.makeMealsObject()
            beforeEach('insert meals', () => {
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

            it('responds with 204 and removes the meal', () => {
                const idToRemove = 2
                const removedMeal = testMeals.filter(meal => meal.id !== idToRemove)
                const expectedMeals = removedMeal.reduce( (acc, item) => ({
                    ...acc, [item.day]: removedMeal.filter( (i) => i.day === item.day)
                }), {} )

                return supertest(app)
                    .delete(`/api/meals/${idToRemove}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/meals`)
                        .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                        .expect(expectedMeals)
                    )
            })
        })
    })
})