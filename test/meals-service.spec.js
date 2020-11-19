const knex = require('knex');
const MealsService = require('../src/meals/meals-service');
const helpers = require('./test-helpers');

describe('Meals Service object', () => {
  let db;

  const {
    testUsers,
    testRecipes,
    testMeals,
  } = helpers.makeRecipesFixtures();

  before('setup db', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
  });

  before('clean the table', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'));

  afterEach('clean up', () => db.raw('TRUNCATE recipes, users, meals RESTART IDENTITY CASCADE'));

  after(() => db.destroy());

  context('Given \'meals\' has data', () => {
    beforeEach('insert meals', () => db
      .into('users')
      .insert(testUsers)
      .then(() => db
        .into('recipes')
        .insert(testRecipes)
        .then(() => db
          .into('meals')
          .insert(testMeals))));
    it('getAllMeals() resolves all meals from \'meals\' table', () => MealsService
      .getAllMeals(db)
      .then((actual) => {
        expect(actual).to.eql(testMeals);
      }));

    it('getById() resolves a meal by id from \'meals\' table', () => {
      const thirdId = 3;
      const thirdTestMeal = testMeals[thirdId - 1];
      return MealsService.getById(db, thirdId)
        .then((actual) => {
          expect(actual).to.eql({
            id: thirdId,
            day: thirdTestMeal.day,
            recipe_id: thirdTestMeal.recipe_id,
            user_id: thirdTestMeal.user_id,
          });
        });
    });

    it('deleteMeal() removes a meal by id from \'meals\'', () => {
      const mealId = 3;
      return MealsService.deleteMeal(db, mealId)
        .then(() => MealsService.getAllMeals(db))
        .then((allMeals) => {
          const expected = testMeals.filter((meal) => meal.id !== mealId);
          expect(allMeals).to.eql(expected);
        });
    });
  });

  context('Given \'meals\' has no data', () => {
    beforeEach('insert meals', () => db
      .into('users')
      .insert(testUsers)
      .then(() => db
        .into('recipes')
        .insert(testRecipes)));
    it('getAllmeals() resolves an empty array', () => MealsService.getAllMeals(db)
      .then((actual) => {
        expect(actual).to.eql([]);
      }));

    it('insertMeal() inserts a new meal and resolves the new mealwith an \'id\'', () => {
      const newMeal = {
        day: 'Sunday',
        recipe_id: 1,
        user_id: 1,
      };

      return MealsService.insertMeal(db, newMeal)
        .then((actual) => {
          expect(actual).to.eql({
            id: 1,
            day: newMeal.day,
            recipe_id: newMeal.recipe_id,
            user_id: newMeal.user_id,
          });
        });
    });
  });
});
