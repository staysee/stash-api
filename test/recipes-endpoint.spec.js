const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const supertest = require('supertest')
const helpers = require('./test-helpers')
const { contentSecurityPolicy } = require('helmet')


describe('Recipes Endpoints', function() {
    let db

    const { 
        testUsers, 
        testRecipes, 
        testMeals } = helpers.makeRecipesFixtures()

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

    describe(`GET /api/recipes`, () => {
        context('Given no recipes', () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
            })

            it('responds with 200 and an empty list', () => {
                
                return supertest(app)
                    .get('/api/recipes')
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, [])
            })
        })

        context('Given there are recipes in the database', () => {
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
    
            it('responds with 200 and all of the recipes', () => {
                return supertest(app)
                    .get('/api/recipes')
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, testRecipes)
            })
        })

        context(`Given an XSS attack recipe`, () => {
            const { maliciousRecipe, expectedRecipe } = helpers.makeMaliciousRecipe()
            beforeEach('insert malicious recipe', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('recipes')
                            .insert([ maliciousRecipe ])
                    })
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/recipes`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedRecipe.title)
                        expect(res.body[0].ingredients).to.eql(expectedRecipe.ingredients)
                        expect(res.body[0].instructions).to.eql(expectedRecipe.instructions)
                        expect(res.body[0].image_url).to.eql(expectedRecipe.image_url)
                        

                    })
            })
        })
    })

    describe(`GET /api/recipes/user`, () => {
        context(`Given a user has no recipes`, () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
            })

            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/recipes/user')
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, [])
            })
        })

        context('Given a user has recipes', () => {
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
    
            it('responds with 200 and the user recipes', () => {
                return supertest(app)
                    .get('/api/recipes/user')
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .expect(res => {
                        db
                            .from('recipes')
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

    describe(`GET /api/recipes/:id`, () => {
        context('Given no recipes', () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
            })
            it('responds with 404', () => {
                const recipeId = 123456
                return supertest(app)
                    .get(`/api/recipes/${recipeId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Recipe doesn't exist` } })
            })
        })

        context(`Given there are recipes in the database`, () => {
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

            it('responds with 200 and the specified recipe', () => {
                const recipeId = 2
                const expectedRecipe = testRecipes[recipeId - 1]
                return supertest(app)
                    .get(`/api/recipes/${recipeId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedRecipe)
            })
        })

        context(`Given an XSS attack recipe`, () => {
            const { maliciousRecipe, expectedRecipe } = helpers.makeMaliciousRecipe()
            beforeEach('insert malicious recipe', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('recipes')
                            .insert([maliciousRecipe])
                    })
            })

            it ('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/recipes/${maliciousRecipe.id}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedRecipe.title)
                        expect(res.body.ingredients).to.eql(expectedRecipe.ingredients)
                        expect(res.body.instructions).to.eql(expectedRecipe.instructions)
                        expect(res.body.image_url).to.eql(expectedRecipe.image_url)
                    })
            })
        })
    })

    describe(`POST /api/recipes`, () => {
        beforeEach('', () => {
            return db
                .into('users')
                .insert(testUsers)
        })

        it('creates a recipe, responding with 201 and the new recipe', () => {
            this.retries(3)
            const newRecipe = {
                title: 'Test new recipe',
                ingredients: 'Test ingredients',
                instructions: 'Test instructions',
                meal_type: 'Breakfast',
                image_url: 'https://via.placeholder.com/100'
            }
            return supertest(app)
                .post('/api/recipes')
                .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                .send(newRecipe)
                .expect(201)
                .expect( res => {
                    expect(res.body.title).to.eql(newRecipe.title)
                    expect(res.body.ingredients).to.eql(newRecipe.ingredients)
                    expect(res.body.instructions).to.eql(newRecipe.instructions)
                    expect(res.body.meal_type).to.eql(newRecipe.meal_type)
                    expect(res.body.image_url).to.eql(newRecipe.image_url)
                    expect(res.body.user_id).to.eql(testUsers[0].id)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/recipes/${res.body.id}`)
                    const expected = new Date().toLocaleString()
                    const actual = new Date(res.body.date_created).toLocaleString()
                    expect(actual).to.eql(expected)
                })
                .expect(res => {
                    db
                        .from('recipes')
                        .select('*')
                        .where({user_id: testUsers[0].id})
                        .first()
                        .then( row => {
                            expect(row.title).to.eql(newRecipe.title)
                            expect(row.ingredients).to.eql(newRecipe.ingredients)
                            expect(row.instructions).to.eql(newRecipe.instructions)
                            expect(row.image_url).to.eql(newRecipe.image_url)
                            expect(row.user_id).to.eql(testUsers[0].id)
                            const expected = new Date().toLocaleString()
                            const actual = new Date(row.date_created).toLocaleString()
                            expect(actual).to.eql(expected)
                        })
                })
        })

        const requiredFields = ['title', 'ingredients', 'instructions', 'meal_type', 'image_url']
        
        requiredFields.forEach(field => {
            const newRecipe = {
                title: 'Test new recipe',
                instructions: 'Test instructions',
                ingredients: 'Test ingredients',
                meal_type: 'Breakfast',
                image_url: 'https://via.placeholder.com/100'
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newRecipe[field]
    
                return supertest(app)
                    .post('/api/recipes')
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .send(newRecipe)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })

            it('removes XSS attack content from response', () => {
                const { maliciousRecipe, expectedRecipe } = helpers.makeMaliciousRecipe()
                return supertest(app)
                    .post(`/api/recipes`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .send(maliciousRecipe)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedRecipe.title)
                        expect(res.body.ingredients).to.eql(expectedRecipe.ingredients)
                        expect(res.body.instructions).to.eql(expectedRecipe.instructions)
                        expect(res.body.image_url).to.eql(expectedRecipe.image_url)
                    })
            })
        })
    })

    describe(`DELETE /api/recipes/:id`, () => {
        context('Given no recipes', () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
            })

            it(`responds with 404`, () => {
                const recipeId = 123456
                return supertest(app)
                    .delete(`/api/recipes/${recipeId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Recipe doesn't exist` } })
            })
        })
        context('Given there are recipes in the database', () => {
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

            it('responds with 204 and removes the recipes', () => {
                const idToRemove = 1
                const expectedRecipes = testRecipes.filter(recipe => recipe.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/recipes/${idToRemove}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/recipes`)
                        .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                        .expect(expectedRecipes)
                    )
            })
        })
    })

    describe(`PATCH /api/recipes/:id`, () => {
        context(`Given no recipes`, () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
            })
            it('responds with 404', () => {
                const recipeId = 123456
                return supertest(app)
                    .delete(`/api/recipes/${recipeId}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { 
                        error: { message: `Recipe doesn't exist` }
                    })
            })
        })

        context('Given there are recipes in the database', () => {
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

            it('responds with 204 and updates the recipe', () => {
                const idToUpdate = 1
                const recipeToUpdate = testRecipes.find(recipe => recipe.id === idToUpdate)
                const updateRecipe = {
                    title: 'updated recipe title',
                    ingredients: 'New ingredients',
                    instructions: 'Updated instructions',
                    meal_type: 'Lunch',
                    image_url: 'https://via.placeholder.com/100',
                }

                const expectedRecipe = {
                    ...recipeToUpdate,
                    ...updateRecipe
                }
                return supertest(app)
                    .patch(`/api/recipes/${idToUpdate}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .send(updateRecipe)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/recipes/${idToUpdate}`)
                            .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                            .expect(expectedRecipe)
                    )
            })

            it(`responds with 400 with no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/recipes/${idToUpdate}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: { message: `Request body must contain either 'title', 'ingredients', 'instructions', 'image_url'`}
                    })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateRecipe = {
                    title: `updated recipe title`
                }
                const expectedRecipe = {
                    ...testRecipes[idToUpdate - 1],
                    ...updateRecipe
                }

                return supertest(app)
                    .patch(`/api/recipes/${idToUpdate}`)
                    .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                    .send({
                        ...updateRecipe,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/recipes/${idToUpdate}`)
                            .set(`Authorization`, helpers.makeAuthHeader(testUsers[0]))
                            .expect(expectedRecipe)
                    )
            })
        })
    })
})