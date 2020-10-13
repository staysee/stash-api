const RecipesService = require('../src/recipes/recipes-service')
const knex = require('knex')
const { expect } = require('chai')
const { makeUsersArray, makeRecipesArray } = require('./test-helpers')
const { getAllRecipes } = require('../src/recipes/recipes-service')

describe(`Recipes service object`, function() {
    let db

    before('setup db', () => {
        db = knex({
            client: 'pg', 
            connection: process.env.TEST_DATABASE_URL
        })
    })

    before ('clean the table', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    afterEach('clean up', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    after(() => db.destroy())

    
    context(`Given 'recipes' has data`, () => {
        const testUsers = makeUsersArray()
        const testRecipes = makeRecipesArray()

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
        it(`getAllRecipes() resolves all recipes from 'recipes' table`, () => {
            return RecipesService
                .getAllRecipes(db)
                .then(actual => {
                    expect(actual).to.eql(testRecipes.map(recipe => ({
                        ...recipe, date_created: new Date(recipe.date_created)
                    })))
                })
        })

        it(`getById() resolves a recipe by id from 'recipes' table`, () => {
            const thirdId = 3
            const thirdTestRecipe = testRecipes[thirdId-1]
            return RecipesService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        title: thirdTestRecipe.title,
                        instructions: thirdTestRecipe.instructions,
                        ingredients: thirdTestRecipe.ingredients,
                        meal_type: thirdTestRecipe.meal_type,
                        image_url: thirdTestRecipe.image_url,
                        date_created: new Date(thirdTestRecipe.date_created),
                        user_id: thirdTestRecipe.user_id
                    })
                })
        })

        it(`deleteRecipe() removes a recipe by id from 'recipes'`, () => {
            const recipeId = 3
            return RecipesService.deleteRecipe(db, recipeId)
                .then(() => RecipesService.getAllRecipes(db))
                .then(allRecipes => {
                    expect(allRecipes.find(recipes => recipes.id === recipeId)).to.eql(undefined)
                })
        })

        it(`updateRecipe() updates a recipe from the 'recipes' table`, () => {
            const idOfRecipeToUpdate = 3
            const newRecipeData = {
                title: 'updated title',
                ingredients: 'updated ingredients',
                instructions: 'updated instructions',
                meal_type: 'Snack',
                image_url: 'https://via.placeholder.com/100',
                date_created: new Date('2029-01-22T16:28:32.615Z'),
                user_id: 1
            }
            return RecipesService.updateRecipe(db, idOfRecipeToUpdate, newRecipeData)
                .then(() => RecipesService.getById(db, idOfRecipeToUpdate))
                .then(recipe => {
                    expect(recipe).to.eql({
                        id: idOfRecipeToUpdate,
                        ...newRecipeData
                    })
                })
        })
    })

    context(`Given 'recipes' has no data`, () => {
        const testUsers = makeUsersArray()

        beforeEach(() => {
            return db
                .into('users')
                .insert(testUsers)
        })
        it(`getAllRecipes() resolves an empty array`, () => {
            return RecipesService.getAllRecipes(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })

        it(`insertRecipe() inserts a new recipe and resolves the new recipe with an 'id'`, () => {
            const newRecipe = {
                title: 'Test new title',
                ingredients: 'Test Ingredients',
                instructions: 'Test Instructions',
                meal_type: 'Lunch',
                image_url: 'https://via.placeholder.com/150',
                date_created: new Date('2020-01-01T00:00:00.000Z'),
                user_id: 1
            }
            return RecipesService.insertRecipe(db, newRecipe)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        title: newRecipe.title,
                        ingredients: newRecipe.ingredients,
                        instructions: newRecipe.instructions,
                        meal_type: newRecipe.meal_type,
                        image_url: newRecipe.image_url,
                        date_created: new Date(newRecipe.date_created),
                        user_id: newRecipe.user_id
                    })
                })
        })
    })
})
