const UsersService = require('../src/users/users-service')
const knex = require('knex')
const { expect } = require('chai')
const helpers = require('./test-helpers')


describe(`Users Service object`, () => {
    let db
    
    const {
        testUsers,
        testRecipes,
        testMeals
    } = helpers.makeRecipesFixtures()

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
            console.log(`users here:`, testUsers)
            return UsersService.getAllUsers(db)
                .then(actual => {
                    console.log(`ACTUAL`, actual)
                    expect(actual).to.eql(testUsers)
                })
        })

        it(`getById() resolves a user by id from 'users' table`, () => {
            const secondId = 2
            const secondTestUser = testUsers.find( user => user.id === secondId)
            
            return UsersService.getById(db, secondId)
                .then(actual => {
                    expect(actual.username).to.eql(secondTestUser.username)
                    expect(actual.firstname).to.eql(secondTestUser.firstname)
                    expect(actual.lastname).to.eql(secondTestUser.lastname)
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
            const userMeals = helpers.makeMealsObject()
            const newUserData = {
                username: 'username',
                firstname: 'firstname',
                lastname: 'lastname',
            }
            return UsersService.updateUser(db, idOfUserToUpdate, newUserData)
                .then(() => UsersService.getById(db, idOfUserToUpdate))
                .then(user => {
                    expect(user.username).to.eql(newUserData.username)
                    expect(user.firstname).to.eql(newUserData.firstname)
                    expect(user.lastname).to.eql(newUserData.lastname)
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