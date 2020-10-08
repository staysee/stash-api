const UsersService = require('../src/users/users-service')
const knex = require('knex')
const { expect } = require('chai')
const { makeUsersArray } = require('./users.fixtures')
const { makeRecipesArray } = require('./recipes.fixtures')
const { makeMealsArray, makeMealsObject } = require('./meals.fixtures')

describe(`Users Service object`, () => {
    let db
    
    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
    })

    before ('clean the table', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))
    afterEach ('clean up after each test', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'))

    after(() => db.destroy())

    context(`Given 'users' has data`, () => {
        const testUsers = makeUsersArray()
        const testRecipes = makeRecipesArray()
        const testMeals = makeMealsArray()

        beforeEach(() => {
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

        it(`getAllUsers() from 'users' table`, () => {
            return UsersService.getAllUsers(db)
                .then(actual => {
                    expect(actual).to.eql(testUsers)
                })
        })

        it(`getById() resolves a user by id from 'users' table`, () => {
            const thirdId = 3
            const thirdTestUser= testUsers[thirdId-1]
            return UsersService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        username: thirdTestUser.username,
                        firstname: thirdTestUser.firstname,
                        lastname: thirdTestUser.lastname,
                        recipes: thirdTestUser.recipes,
                        meals: thirdTestUser.meals
                    })
                })
            
        })

        it (`deleteUser() removes a user`, () => {
            const userId = 1
            return UsersService.deleteUser(db, userId)
                .then(() => UsersService.getAllUsers(db))
                .then(allUsers => {
                    const expected = testUsers.filter(user => user.id !== userId)
                    expect(allUsers).to.eql(expected)
                })
        })

        it(`updateUser() updates a user`, () => {
            const idOfUserToUpdate = 1
            const userMeals = makeMealsObject()
            const newUserData = {
                username: 'username',
                firstname: 'firstname',
                lastname: 'lastname',
                recipes: testRecipes,
                meals: userMeals
            }
            return UsersService.updateUser(db, idOfUserToUpdate, newUserData)
                .then(() => UsersService.getById(db, idOfUserToUpdate))
                .then(user => {
                    expect(user).to.eql({
                        id: idOfUserToUpdate,
                        ...newUserData
                    })
                })
        })
    })

    context(`Given 'users' does not have data`, () => {
        it(`getAllUsers() resolves an empty array`, () => {
            return UsersService.getAllUsers(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })

        it(`insertUser() inserts a user and resolves the user with an id`, () => {
            const newUser = {
                username: 'newuser',
                firstname: 'New',
                lastname: 'User',
                password: 'password',
                date_created: new Date('2029-01-22T16:28:32.615Z')
            }
            return UsersService.insertUser(db, newUser)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        username: newUser.username,
                        firstname: newUser.firstname,
                        lastname: newUser.lastname,
                        password: newUser.password,
                        date_created: new Date('2029-01-22T16:28:32.615Z')
                    })
                })
        })
    })

    
})