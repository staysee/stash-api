const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const supertest = require('supertest')

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

    context('Given there are recipes in the database', () => {
        const testRecipes = [
            {
                id: 1,
                title: 'First Test Recipe',
                ingredients: 'Some test ingredients',
                instructions: 'Some test instructions',
                meal_type: 'Breakfast',
                image_url: 'https://via.placeholder.com/100',
                date_created: '2029-01-22T16:28:32.615Z'
            },
            {
                id: 2,
                title: 'Second Test Recipe',
                ingredients: 'Some test ingredients',
                instructions: 'Some test instructions',
                meal_type: 'Lunch',
                image_url: 'https://via.placeholder.com/100',
                date_created: '2029-01-22T16:28:32.615Z'
            },
            {
                id: 3,
                title: 'Third Test Recipe',
                ingredients: 'Some test ingredients',
                instructions: 'Some test instructions',
                meal_type: 'Dinner',
                image_url: 'https://via.placeholder.com/100',
                date_created: '2029-01-22T16:28:32.615Z'
            },
            {
                id: 4,
                title: 'Fourth Test Recipe',
                ingredients: 'Some test ingredients',
                instructions: 'Some test instructions',
                meal_type: 'Breakfast',
                image_url: 'https://via.placeholder.com/100',
                date_created: '2029-01-22T16:28:32.615Z'
            },
            {
                id: 5,
                title: 'Fourth Test Recipe',
                ingredients: 'Some test ingredients',
                instructions: 'Some test instructions',
                meal_type: 'Dinner',
                image_url: 'https://via.placeholder.com/100',
                date_created: '2029-01-22T16:28:32.615Z'
            }
        ];

        beforeEach('insert recipes', () => {
            return db
                .into('recipes')
                .insert(testRecipes)
        })

        it('GET /recipes responds with 200 and all of the recipes', () => {
            return supertest(app)
                .get('/recipes')
                .expect(200, testRecipes)
                // TODO: add more assertions about the body
        })

        it('GET /recipes/:id responds with 200 and the specified recipe', () => {
            const recipeId = 2
            const expectedRecipe = testRecipes[recipeId - 1]
            return supertest(app)
                .get(`/recipes/${recipeId}`)
                .expect(200, expectedRecipe)
        })
    })
})