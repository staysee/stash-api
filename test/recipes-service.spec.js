const RecipesService = require('../src/recipes/recipes-service')
const knex = require('knex')
const { expect } = require('chai')
const { makeRecipesArray } = require('./recipes.fixtures')
const { makeUsersArray } = require('./users.fixtures')

describe.only(`Recipes service object`, function() {
    let db

    const testUsers = makeUsersArray()
    const testRecipes = makeRecipesArray()

    before('setup db', () => {
        db = knex({
            client: 'pg', 
            connection: process.env.TEST_DATABASE_URL
        })
    })

    before ('clean db', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    

    after(() => db.destroy())

    context(`Given 'recipes' has data`, () => {
        before(() => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('recipes')
                        .insert(testRecipes)
                })
        })
        it(`getAllRecipes() resolves all recipes from 'recipes' table`, () => {
            return RecipesService
                .getAllRecipes(db)
                .then(actual => {
                    expect(actual).to.eql(testRecipes.map(recipe => ({
                        ...recipe, date_created: new Date(recipe.date_created)
                    })))
                })
        })
    })

    // before all tests run and after each individual test, empty the 'recipes' table
    // before ('clean db', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))
    // afterEach('clean db', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    // // after all tests run, let go of the db connection
    // after('destroy db connection', () => db.destroy())

    // context(`Given 'recipes' has data`, () => {
    //     before(() => {
    //         return db
    //             .into('users')
    //             .insert(testUsers)
    //             .then(() => {
    //                 return db
    //                     .into('recipes')
    //                     .insert(testRecipes)
    //             })
    //     })
    //     it('return an empty array', () => {
    //         return RecipesService
    //             .getAllRecipes(db)
    //             .then(recipes => expect(recipes).to.eql([]))
    //     })
    //     it(`resolves all recipes`, () => {
    //         return RecipesService
    //             .getAllRecipes(db)
    //             .then(actual => {
    //                 expect(actual).to.eql(testRecipes.map(recipe => ({
    //                     ...recipe, date_created: new Date(recipe.date_created)
    //                 })))
    //             })
    //     })
    // })
})
