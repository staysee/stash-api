const MealsService = {
  getAllMeals(knex) {
    return knex.select('*').from('meals');
  },
  getUserMeals(knex, userId) {
    return knex('meals')
      .where({ user_id: userId })
      .select('*');
  },
  insertMeal(knex, newMeal) {
    return knex
      .insert(newMeal)
      .into('meals')
      .returning('*')
      .then((rows) => rows[0]);
  },
  getById(knex, id) {
    return knex
      .from('meals')
      .select('*')
      .where('id', id)
      .first();
  },
  deleteMeal(knex, id) {
    return knex('meals')
      .where({ id })
      .delete();
  },
  updateMeal(knex, id, newMealFields) {
    return knex('meals')
      .where({ id })
      .update(newMealFields);
  },
  serializeMeal(meal) {
    return {
      id: meal.id,
      day: meal.day,
      recipe_id: meal.recipe_id,
      user_id: meal.user_id,
    };
  },
};

module.exports = MealsService;
