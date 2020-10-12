const MealsService = require('../src/meals/meals-service')
const knex = require('knex')
const { expect } = require('chai')
const { makeMealsArray } = require('./meals.fixtures')
const { makeUsersArray } = require('./users.fixtures')
const { makeRecipesArray } = require('./recipes.fixtures')

describe(`Meals Service object`, function() {
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

    
    context(`Given 'meals' has data`, () => {
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
        it(`getAllMeals() resolves all meals from 'meals' table`, () => {
            return MealsService
                .getAllMeals(db)
                .then(actual => {
                    expect(actual).to.eql(testMeals)
                })
        })

        it(`getById() resolves a meal by id from 'meals' table`, () => {
            const thirdId = 3
            const thirdTestMeal = testMeals[thirdId-1]
            return MealsService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        day: thirdTestMeal.day,
                        recipe_id: thirdTestMeal.recipe_id,
                        user_id: thirdTestMeal.user_id
                    })
                })
        })

        it(`deleteMeal() removes a meal by id from 'meals'`, () => {
            const mealId = 3
            return MealsService.deleteMeal(db, mealId)
                .then(() => MealsService.getAllMeals(db))
                .then(allMeals => {
                    const expected = testMeals.filter(meal => meal.id !== mealId)
                    expect(allMeals).to.eql(expected)
                })
        })
    })

    context(`Given 'meals' has no data`, () => {
        const testUsers = makeUsersArray()
        const testRecipes = makeRecipesArray()

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
        it(`getAllmeals() resolves an empty array`, () => {
            return MealsService.getAllMeals(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })

        it(`insertMeal() inserts a new meal and resolves the new mealwith an 'id'`, () => {
            const newMeal = {
                day: 'Sunday',
                recipe_id: 1,
                user_id: 1
            }

            return MealsService.insertMeal(db, newMeal)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        day: newMeal.day,
                        recipe_id: newMeal.recipe_id,
                        user_id: newMeal.user_id
                    })
                })
        })
    })
})
