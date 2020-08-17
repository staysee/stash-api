const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const supertest = require('supertest')
const { makeRecipesArray } = require('./recipes.fixtures')

describe.only('Recipes Endpoints', function() {
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

    describe(`GET /recipes`, () => {
        context('Given no recipes', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/recipes')
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
                    .get('/recipes')
                    .expect(200, testRecipes)
            })
        })
    })

    describe(`GET /recipes/:id`, () => {
        context('Given no recipes', () => {
            it('responds with 404', () => {
                const recipeId = 123456
                return supertest(app)
                    .get(`/recipes/${recipeId}`)
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
                    .get(`/recipes/${recipeId}`)
                    .expect(200, expectedRecipe)
            })
        })
    })

    describe(`POST /recipes`, () => {
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
                .post('/recipes')
                .send(newRecipe)
                .expect(201)
                .expect( res => {
                    expect(res.body.title).to.eql(newRecipe.title)
                    expect(res.body.ingredients).to.eql(newRecipe.ingredients)
                    expect(res.body.instructions).to.eql(newRecipe.instructions)
                    expect(res.body.meal_type).to.eql(newRecipe.meal_type)
                    expect(res.body.image_url).to.eql(newRecipe.image_url)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/recipes/${res.body.id}`)
                    const expected = new Date().toLocaleString()
                    const actual = new Date(res.body.date_created).toLocaleString()
                    expect(actual).to.eql(expected)
                })
                //make second request to the GET /recipe/:id
                .then(postRes =>
                    supertest(app)
                    .get(`/recipes/${postRes.body.id}`)
                    .expect(postRes.body)
                )
        })
    })
})