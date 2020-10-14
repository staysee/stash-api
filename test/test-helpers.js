const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeMealsArray() {
    return [
        {
            id: 1,
            day: 'Monday',
            recipe_id: 1,
            user_id: 1
        },
        {
            id: 2,
            day: 'Tuesday',
            recipe_id: 2,
            user_id: 1
        },
        {
            id: 3,
            day: 'Tuesday',
            recipe_id: 3,
            user_id: 1
        },
        {
            id: 4,
            day: 'Wednesday',
            recipe_id: 1,
            user_id: 1
        }
    ];
}

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

function makeRecipesArray() {
    return [
        {
            id: 1,
            title: 'First Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Breakfast',
            image_url: 'https://via.placeholder.com/100',
            date_created: '2029-01-22T16:28:32.615Z',
            user_id: 1
        },
        {
            id: 2,
            title: 'Second Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Lunch',
            image_url: 'https://via.placeholder.com/100',
            date_created: '2029-01-22T16:28:32.615Z',
            user_id: 2
        },
        {
            id: 3,
            title: 'Third Test Recipe',
            ingredients: 'Some test ingredients',
            instructions: 'Some test instructions',
            meal_type: 'Dinner',
            image_url: 'https://via.placeholder.com/100',
            date_created: '2029-01-22T16:28:32.615Z',
            user_id: 1
        }
    ];
}

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

function makeUsersArray() {
    return [
        {
            id: 1,
            username: 'janedoe@test.com',
            firstname: 'Jane',
            lastname: 'Doe',
            password: bcrypt.hashSync('password', 1),
            date_created: new Date('2029-01-22T16:28:32.615Z')
        },
        {
            id: 2,
            username: 'johndoe@test.com',
            firstname: 'John',
            lastname: 'Doe',
            password: bcrypt.hashSync('password', 1),
            date_created: new Date('2100-05-22T16:28:32.615Z')

        }
    ]
}

function makeRecipesFixtures() {
    const testUsers = makeUsersArray()
    const testRecipes = makeRecipesArray()
    const testMeals = makeMealsArray()
    return { testUsers, testRecipes, testMeals }
}

// function makeAuthHeader(user, secret=process.env.JWT_SECRET) {
//     const token = jwt.sign({ user_id: user.id }, secret, {
//       subject: user.username,
//       algorithm: 'HS256',
//     })
//     return `Bearer ${token}`
//   }
function makeAuthHeader(user){
    const token = Buffer.from(`${user.username}:${user.password}`).toString('base64')
    return `Basic ${token}`
}

module.exports = {
    makeMealsArray,
    makeMealsObject,
    makeRecipesArray,
    makeMaliciousRecipe,
    makeUsersArray,

    makeRecipesFixtures,
    makeAuthHeader
}