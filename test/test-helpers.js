const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL
})

async function initiateDatabase() {
    await db.into('users').insert(users)
    await db.into('recipes').insert(recipes)
    await db.into('meals').insert(meals)
}

async function destroyDatabase() {
    await db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE')
    await db.destroy()
}

const users = [
    {
        username: 'janedoe',
        firstname: 'Jane',
        lastname: 'Doe',
        password: '$2a$12$0qU91w.TIiPTs.DEeiUZzuacK2aCXw201VrEZDGV4pV6w7H1qM5aW'
    },
    {
        username: 'johndoe',
        firstname: 'John',
        lastname: 'Doe',
        password: '$2a$12$0qU91w.TIiPTs.DEeiUZzuacK2aCXw201VrEZDGV4pV6w7H1qM5aW'
    },
    {
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        password: '$2a$12$0qU91w.TIiPTs.DEeiUZzuacK2aCXw201VrEZDGV4pV6w7H1qM5aW',
    }
]

const meals = [
    {
        day: 'Monday',
        recipe_id: 1,
        user_id: 1
    },
    {
        day: 'Tuesday',
        recipe_id: 2,
        user_id: 1
    },
    {
        day: 'Tuesday',
        recipe_id: 3,
        user_id: 1
    },
    {
        day: 'Wednesday',
        recipe_id: 1,
        user_id: 1
    }
];


function makeMealsObject() {
    return { 
            Monday: [ 
                { id: 1, day: 'Monday', recipe_id: 1, user_id: 1 }
            ],
            Tuesday: [
                { id: 2, day: 'Tuesday', recipe_id: 2, user_id: 1 },
                { id: 3, day: 'Tuesday', recipe_id: 3, user_id: 1 } ],
            Wednesday: [ 
                { id: 4, day: 'Wednesday', recipe_id: 1, user_id: 1 } 
            ] 
        }
}

const recipes = [
    {

        title: 'First Test Recipe',
        ingredients: 'Some test ingredients',
        instructions: 'Some test instructions',
        meal_type: 'Breakfast',
        image_url: 'https://via.placeholder.com/100',
        user_id: 1
    },
    {
        title: 'Second Test Recipe',
        ingredients: 'Some test ingredients',
        instructions: 'Some test instructions',
        meal_type: 'Lunch',
        image_url: 'https://via.placeholder.com/100',
        user_id: 2
    },
    {
        title: 'Third Test Recipe',
        ingredients: 'Some test ingredients',
        instructions: 'Some test instructions',
        meal_type: 'Dinner',
        image_url: 'https://via.placeholder.com/100',
        user_id: 1
    }
];


function makeMaliciousRecipe() {
    const maliciousRecipe = {
        id: 911,
        title: 'Bad title <script>alert("xss");</script>',
        ingredients: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        instructions: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        meal_type: 'Breakfast',
        image_url: 'https://url.to.file.which/does-not.exist',
        user_id: 2
    }

    const expectedRecipe = {
        ...maliciousRecipe,
        title: `Bad title &lt;script&gt;alert(\"xss\");&lt;/script&gt;`,
        ingredients: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        instructions: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        meal_type: `Breakfast`,
        image_url: `https://url.to.file.which/does-not.exist`,
        user_id: 2
    }

    return {
        maliciousRecipe,
        expectedRecipe
    }
}


function makeRecipesFixtures() {
    const testUsers = makeUsersArray()
    const testRecipes = makeRecipesArray()
    const testMeals = makeMealsArray()
    return { testUsers, testRecipes, testMeals }
}

function makeAuthHeader(user, secret=process.env.JWT_SECRET) {
    const token = jwt.sign(
        { user_id: user.id },
         secret,
        {
            subject: user.username,
            algorithm: 'HS256',
        }
    )

    return `Bearer ${token}`
  }

module.exports = {
    makeMealsObject,
    makeMaliciousRecipe,
    initiateDatabase,
    destroyDatabase,
    makeRecipesFixtures,
    makeAuthHeader
}