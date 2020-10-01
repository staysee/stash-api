const MealsService = {
    getAllMeals(knex) {
        return knex.select('*').from('meals')
    },            
    insertMeal(knex, newMeal) {
        return knex
            .insert(newMeal)
            .into('meals')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('meals')
            .select('*')
            .where('id', id)
            .first()
    }, 
    deleteMeal(knex, id) {
        return knex('meals')
            .where({ id })
            .delete()
    },
    updateMeal(knex, id, newMealFields) {
        return knex('meals')
        .where({ id })
        .update(newMealFields)
    }
}

module.exports = MealsService