const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')


describe(` Meals Endpoints`, () => {
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
    let signedInUser;
    // let newMeal = {
    //     day: 'Saturday',
    //     recipe_id: 5
    // }

    before(async () => {
        await helpers.initiateDatabase()
        signedInUser = await request.post('/api/auth/login').send(testUser)
    })

    after(async () => {
        await helpers.destroyDatabase()
    })

    describe(`GET /api/meals`, () => {
        context('Given no meals', () => {
            it.skip('responds with 200 and an empty list', () => {
                console.log(signedInUser.body.authToken);
                return request
                    .get('/api/meals')
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                    .expect(200, {})
            })
        })
        context(`Given there are meals in the database`, () => {
            const mealsOutput = helpers.makeMealsObject()
    
            it(`responds with 200 and all of the meals`, () => {
                return request
                    .get(`/api/meals`)
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                    .expect(200, mealsOutput)
            })
        })
    })

    describe(`GET /api/meals/user`, () => {
        context('Given no user meals', () => {

            it.skip('responds with 200 and an empty list', () => {
                return request
                    .get('/api/meals/user')
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                    .expect(200, {})
            })
        })

        context(`Given user has meals`, () => {
            it(`responds with 200 and all the user meals`, () => {
                return request
                    .get(`/api/meals/user`)
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                    .expect(200)
                    .expect(res => {
                        db
                            .from('meals')
                            .select('*')
                            .where({user_id: 1})
                            .first()
                            .then( row => {
                                expect(row.user_id).to.eql(1)
                            })
                    })

            })
        })
    })

    describe(`GET /api/meals/:id`, () => {
        context('Given no meals', () => {     

            it('responds with 404', () => {
                const mealId = 123
                return request
                    .get(`/api/meals/${mealId}`)
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                    .expect(404, { error: { message: `Meal doesn't exist` } })
            })
        })

        context('Given there are meals in the database', () => {                
            it ('responds with 200 and the specified meal', () => {
                const mealId = 2
                const expectedMeal = {
                    "day": "Tuesday",
                    "id": 2,
                    "recipe_id": 2,
                    "user_id": 1
                    }
            
                return request
                    .get(`/api/meals/${mealId}`)
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                    .expect(200, expectedMeal)
            })
        })
    })

    describe(`POST /api/meals`, () => {

        it('creates a meal, responding with 201 and the new meal', () => {
            const newMeal = {
                day: 'Saturday',
                recipe_id: 1,
                user_id: 1
            }
            
            return request
                .post('/api/meals')
                .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                .send(newMeal)
                .expect(201)
                .expect(res => {
                    expect(res.body.day).to.eql(newMeal.day)
                    expect(res.body.recipe_id).to.eql(newMeal.recipe_id)
                    expect(res.body.user_id).to.eql(1)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/meals/${res.body.id}`)
                })
        })

        const requiredFields = ['day', 'recipe_id']

        requiredFields.forEach(field => {
            const newMeal = {
                day: 'Test title',
                recipe_id: 1
            }

            it(`responds with 400 and an error message when '${field}' is missing`, () => {
                delete newMeal[field]
                console.log(`NEW MEAL`, newMeal)
                return request
                    .post('/api/meals')
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
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
                const mealId = 10
                return request
                    .delete(`/api/meals/${mealId}`)
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                    .expect(404, { error: { message: `Meal doesn't exist` } })
            })
        })
        context('Given there are meals in the database', () => {

            it('responds with 204 and removes the meal', () => {
                const idToRemove = 2
                const expectedMeals = {
                    Monday: [ { id: 1, day: 'Monday', recipe_id: 1, user_id: 1 } ],
                    Tuesday: [ { id: 3, day: 'Tuesday', recipe_id: 3, user_id: 1 } ],
                    Wednesday: [ { id: 4, day: 'Wednesday', recipe_id: 1, user_id: 1 } ],
                    Saturday: [ { id: 5, day: 'Saturday', recipe_id: 1, user_id: 1 } ]
                  }

                return request
                    .delete(`/api/meals/${idToRemove}`)
                    .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                    .expect(204)
                    .then(res =>
                        request
                        .get(`/api/meals`)
                        .set(`Authorization`, `Bearer ${signedInUser.body.authToken}`)
                        .expect(expectedMeals)
                    )
            })
        })
    })
})