const xss = require('xss');

const RecipesService = {
  getAllRecipes(knex) {
    return knex.select('*').from('recipes');
  },
  getUserRecipes(knex, userId) {
    return knex('recipes')
      .where({ user_id: userId })
      .select('*');
  },
  insertRecipe(knex, newRecipe) {
    return knex
      .insert(newRecipe)
      .into('recipes')
      .returning('*')
      .then((rows) => rows[0]);
  },
  getById(knex, id) {
    return knex
      .from('recipes')
      .select('*')
      .where('id', id)
      .first();
  },
  deleteRecipe(knex, id) {
    return knex('recipes')
      .where('id', id)
      .delete();
  },
  updateRecipe(knex, id, newRecipeFields) {
    return knex('recipes')
      .where('id', id)
      .update(newRecipeFields);
  },
  serializeRecipe(recipe) {
    return {
      id: recipe.id,
      title: xss(recipe.title),
      ingredients: xss(recipe.ingredients),
      instructions: xss(recipe.instructions),
      meal_type: recipe.meal_type,
      image_url: recipe.image_url,
      date_created: recipe.date_created,
      user_id: recipe.user_id,
    };
  },
};

module.exports = RecipesService;
