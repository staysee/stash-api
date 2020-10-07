const UsersService = {
    getAllUsers(knex) {
        return knex.select('*').from('users')
    },
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('users')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    async getById(knex, id) {
        const [user, userRecipes, userMeals] = await Promise.all([knex
            .from('users').select('*').where('id', id).first(),
            knex('recipes').where('user_id', id).select('*'),
            knex('meals').where('user_id', id).select('*')
        ])

        user.recipes = userRecipes
        user.meals = userMeals

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
    }
}

module.exports = UsersService