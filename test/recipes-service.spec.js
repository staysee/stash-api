// const RecipesService = require('../src/recipes/recipes-service')
// const knex = require('knex')
// const { expect } = require('chai')

// describe(`Recipes service object`, function() {
//     let db

//     const testRecipes = [
//         {
//             id: 1,
//             title: 'First Test Recipe',
//             ingredients: 'Some test ingredients',
//             instructions: 'Some test instructions',
//             meal_type: 'Breakfast',
//             image_url: 'https://via.placeholder.com/100',
//             date_created: '2029-01-22T16:28:32.615Z',
//             user_id: 1
//         },
//         {
//             id: 2,
//             title: 'Second Test Recipe',
//             ingredients: 'Some test ingredients',
//             instructions: 'Some test instructions',
//             meal_type: 'Lunch',
//             image_url: 'https://via.placeholder.com/100',
//             date_created: '2029-01-22T16:28:32.615Z',
//             user_id: 2
//         },
//         {
//             id: 3,
//             title: 'Third Test Recipe',
//             ingredients: 'Some test ingredients',
//             instructions: 'Some test instructions',
//             meal_type: 'Dinner',
//             image_url: 'https://via.placeholder.com/100',
//             date_created: '2029-01-22T16:28:32.615Z',
//             user_id: 1
//         }
//     ]

//     before('setup db', () => {
//         db = knex({
//             client: 'pg', 
//             connection: process.env.TEST_DATABASE_URL
//         })
//     })

//     // before all tests run and after each individual test, empty the 'recipes' table
//     before ('clean db', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))
//     afterEach('clean db', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

//     // after all tests run, let go of the db connection
//     after('destroy db connection', () => db.destroy())

//     context(`Given 'recipes' has data`, () => {
//         before(() => {
//             return db
//                 .into('recipes')
//                 .insert(testRecipes)
//         })
//         it('return an empty array', () => {
//             return RecipesService
//                 .getAllRecipes(db)
//                 .then(recipes => expect(recipes).to.eql([]))
//         })
//     })

//         it(`resolves all recipes`, () => {
//             return RecipesService
//                 .getAllRecipes(db)
//                 .then(actual => {
//                     expect(actual).to.eql(testRecipes.map(recipe => ({
//                         ...recipe, date_created: new Date(recipe.date_created)
//                     })))
//                 })
//         })
//     })
//   })