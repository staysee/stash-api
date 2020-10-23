const xss = require('xss')
const bcrypt = require('bcryptjs')

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/

const UsersService = {
    getAllUsers(knex) {
        return knex.select('*').from('users')
    },
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('users')
            .returning('*')
            .then(([user]) => user)
    },
    async getById(knex, id) {
        const [user, userRecipes, userMeals] = await Promise.all([knex
            .from('users').select('*').where('id', id).first(),
            knex('recipes').where('user_id', id).select('*'),
            knex('meals').where('user_id', id).select('*')
        ])

        if (user) {
            user.recipes = userRecipes
            user.meals = userMeals
        }

        return user
    },
    deleteUser(knex, id) {
        return knex('users')
            .where({ id })
            .delete()
    },
    updateUser(knex, id, newUserFields) {
        return knex('users')
        .where({ id })
        .update(newUserFields)
    },
    getUserRecipes(knex, id) {
        return knex('recipes')
            .where('user_id', id)
            .select('*')
    },
    hasUserWithUsername(db, username) {
        return db('users')
            .where({ username })
            .first()
            .then( user => !!user)
    },
    validatePassword(password) {
        if (password.length < 8){
            return 'Password must be longer than 8 characters'
        }
        if (password.length > 72) {
            return 'Password must be less than 72 characters'
        }
        if (password.startsWith(' ') || password.endsWith(' ')) {
            return 'Password must not start or end with spaces'
        }
        if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
            return 'Password must contain 1 upper case, lower case, number and special character'
        }
        return null
    },
    hashPassword(password) {
        return bcrypt.hash(password, 12)
    },
    serializeUser(user) {
        return {
            id: user.id,
            firstname: xss(user.firstname),
            lastname: xss(user.lastname),
            username: xss(user.username),
            date_created: new Date(user.date_created),
            recipes: user.recipes,
            meals: user.meals
        }
    }
}

module.exports = UsersService