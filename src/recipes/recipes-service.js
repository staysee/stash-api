const RecipesService = {
    getAllRecipes(knex) {
        return knex.select('*').from('recipes')
    },
    insertRecipe(knex, newRecipe) {
        return knex
            .insert(newRecipe)
            .into('recipes')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('recipes')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteRecipe(knex, id) {
        return knex('recipes')
            .where('id', id)
            .delete()
    },
    updateRecipe(knex, id, newRecipeFields) {
        return knex('recipes')
            .where('id', id)
            .update(newRecipeFields)
    }
}

module.exports = RecipesService