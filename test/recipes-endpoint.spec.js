const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const supertest = require('supertest')
const { makeRecipesArray } = require('./recipes.fixtures')

describe('Recipes Endpoints', function() {
    let db

    //create knex instance to connect to test DB
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('recipes').truncate())

    afterEach('cleanup', () => db('recipes').truncate())

    describe(`GET /api/recipes`, () => {
        context('Given no recipes', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/recipes')
                    .expect(200, [])
            })
        })

        context('Given there are recipes in the database', () => {
            const testRecipes = makeRecipesArray()
    
            beforeEach('insert recipes', () => {
                return db
                    .into('recipes')
                    .insert(testRecipes)
            })
    
            it('responds with 200 and all of the recipes', () => {
                return supertest(app)
                    .get('/api/recipes')
                    .expect(200, testRecipes)
            })
        })
    })

    describe(`GET /api/recipes/:id`, () => {
        context('Given no recipes', () => {
            it('responds with 404', () => {
                const recipeId = 123456
                return supertest(app)
                    .get(`/api/recipes/${recipeId}`)
                    .expect(404, { error: { message: `Recipe doesn't exist` } })
            })
        })

        context(`Given there are recipes in the database`, () => {
            const testRecipes = makeRecipesArray()

            beforeEach('insert recipes', () => {
                return db
                    .into('recipes')
                    .insert(testRecipes)
            })

            it('responds with 200 and the specified recipe', () => {
                const recipeId = 2
                const expectedRecipe = testRecipes[recipeId - 1]
                return supertest(app)
                    .get(`/api/recipes/${recipeId}`)
                    .expect(200, expectedRecipe)
            })
        })

        context(`Given an XSS attack recipe`, () => {
            const maliciousRecipe = {
                id: 911,
                title: 'Bad title <script>alert("xss");</script>',
                ingredients: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                instructions: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                meal_type: 'Breakfast',
                image_url: 'https://url.to.file.which/does-not.exist'
            }

            beforeEach('insert malicious recipe', () => {
                return db
                    .into('recipes')
                    .insert([maliciousRecipe])
            })

            it ('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/recipes/${maliciousRecipe.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Bad title &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.ingredients).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                        expect(res.body.instructions).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })
            })
        })
    })

    describe(`POST /api/recipes`, () => {
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
                .send(newRecipe)
                .expect(201)
                .expect( res => {
                    expect(res.body.title).to.eql(newRecipe.title)
                    expect(res.body.ingredients).to.eql(newRecipe.ingredients)
                    expect(res.body.instructions).to.eql(newRecipe.instructions)
                    expect(res.body.meal_type).to.eql(newRecipe.meal_type)
                    expect(res.body.image_url).to.eql(newRecipe.image_url)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/recipes/${res.body.id}`)
                    const expected = new Date().toLocaleString()
                    const actual = new Date(res.body.date_created).toLocaleString()
                    expect(actual).to.eql(expected)
                })
                //make second request to the GET /recipe/:id
                .then(postRes =>
                    supertest(app)
                    .get(`/api/recipes/${postRes.body.id}`)
                    .expect(postRes.body)
                )
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

            it(`responds with 400 and an error message when the 'title' is missing`, () => {
                delete newRecipe[field]
    
                return supertest(app)
                    .post('/api/recipes')
                    .send(newRecipe)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe(`DELETE /api/recipes/:id`, () => {
        context('Given no recipes', () => {
            it(`responds with 404`, () => {
                const recipeId = 123456
                return supertest(app)
                    .delete(`/api/recipes/${recipeId}`)
                    .expect(404, { error: { message: `Recipe doesn't exist` } })
            })
        })
        context('Given there are recipes in the database', () => {
            const testRecipes = makeRecipesArray()

            beforeEach('insert recipes', () => {
                return db
                    .into('recipes')
                    .insert(testRecipes)
            })

            it('responds with 204 and removes the recipes', () => {
                const idToRemove = 2
                const expectedRecipes = testRecipes.filter(recipe => recipe.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/recipes/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/recipes`)
                        .expect(expectedRecipes)
                    )
            })
        })
    })

    describe.only(`PATCH /api/recipes/:id`, () => {
        context(`Given no recipes`, () => {
            it('responds with 404', () => {
                const recipeId = 123456
                return supertest(app)
                    .patch(`/api/recipes/${recipeId}`)
                    .expect(404, { 
                        error: { message: `Recipe doesn't exist` }
                    })
            })
        })

        context('Given there are articles in the database', () => {
            const testRecipes = makeRecipesArray()

            beforeEach('insert recipes', () => {
                return db
                    .into('recipes')
                    .insert(testRecipes)
            })

            it('responds with 204 and updates the recipe', () => {
                const idToUpdate = 2
                const updateRecipe = {
                    title: 'updated recipe title',
                    ingredients: 'New ingredients',
                    instructions: 'Updated instructions',
                    meal_type: 'Lunch',
                    image_url: 'https://via.placeholder.com/100',
                }
                const expectedRecipe = {
                    ...testRecipes[idToUpdate - 1],
                    ...updateRecipe
                }
                return supertest(app)
                    .patch(`/api/recipes/${idToUpdate}`)
                    .send(updateRecipe)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/recipes/${idToUpdate}`)
                            .expect(expectedRecipe)
                    )
            })

            it(`responds with 400 with no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/recipes/${idToUpdate}`)
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
                    .send({
                        ...updateRecipe,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/recipes/${idToUpdate}`)
                            .expect(expectedRecipe)
                    )
            })
        })
    })
})