const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
// const { recipes } = require('../store')
const RecipesService = require('./recipes-service')

const recipesRouter = express.Router()
const jsonParser = express.json()


recipesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        RecipesService.getAllRecipes(knexInstance)
            .then(recipes => {
                res.json(recipes)
            })
            .catch(next)
    })
    .post(jsonParser,(req, res, next) => {
        // get the data
        const { title, ingredients, instructions, meal_type, image_url } = req.body
        const newRecipe = { title, ingredients, instructions, meal_type, image_url }
        const knexInstance = req.app.get('db')

        for (const [key, value] of Object.entries(newRecipe)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }

        RecipesService.insertRecipe(knexInstance, newRecipe)
            .then(recipe => {
                res
                    .status(201)
                    .location(`/recipes/${recipe.id}`)
                    .json(recipe)
            })
            .catch(next)
        
        
    })

recipesRouter
    .route('/:id')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        RecipesService.getById(knexInstance, req.params.id)
            .then(recipe => {
                if (!recipe) {
                    return res.status(404).json({
                        error: { message: `Recipe doesn't exist` }
                    })
                }
                res.json(recipe)
            })
            .catch(next)
    })
    .delete((req, res) => {
        const { id } = req.params;

        const recipeIndex = recipes.findIndex( recipe => recipe.id == id)

        if (recipeIndex === -1){
            logger.error(`Recipe with id ${id} not found.`)
            return res
                .status(404)
                .send('Not Found')
        }

        recipes.splice(recipeIndex, 1)

        logger.info(`Recipe with id ${id} deleted.`)
        res
            .status(204)
            .end()
    })

module.exports = recipesRouter