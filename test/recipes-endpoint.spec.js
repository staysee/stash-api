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

})