const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makeUsersArray } = require('./users.fixtures')
const { makeRecipesArray } = require('./recipes.fixtures')
const { makeMealsArray } = require('./meals.fixtures')


describe.only(` Meals Endpoints`, () => {

    let db

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
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/meals')
                    .expect(200, {})
            })
        })
        context(`Given there are meals in the database`, () => {
            const testUsers = makeUsersArray()
            const testRecipes = makeRecipesArray()
            const testMeals = makeMealsArray()
            
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
        context('Given there are meals in the database', () => {
            const testUsers = makeUsersArray()
            const testRecipes = makeRecipesArray()
            const testMeals = makeMealsArray()
                
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
                    .expect(200, expectedMeal)
            })
        })
    })

    describe.only(`POST /api/meals`, () => {
        it ('creates a meal, responding with 201 and the new meal', () => {
            const newMeal = {
                day: 'Thursday',
                recipe_id: 2
            }

            return supertest(app)
                .post('/api/meals')
                .send(newMeal)
                .expect(201)
                .expect(res => {
                    expect(res.body.day).to.eql(newMeal.day)
                    expect(res.body.recipe_id).to.eql(newMeal.recipe_id)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/meals/${res.body.id}`)
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/api/meals/${postRes.body.id}`)
                        .expect(postRes.body)
                )
        })
    })

})