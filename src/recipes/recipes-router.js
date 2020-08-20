const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const xss = require('xss')
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
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        RecipesService.getById(knexInstance, req.params.id)
            .then(recipe => {
                if (!recipe) {
                    return res.status(404).json({
                        error: { message: `Recipe doesn't exist`}
                    })
                }
                res.recipe = recipe // save the recipe for the next middleware
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: recipe.id,
            title: xss(recipe.title),
            ingredients: xss(recipe.ingredients),
            instructions: xss(recipe.instructions),
            meal_type: recipe.meal_type,
            image_url: recipe.image_url
            // date_created: recipe.date_created
        })
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        RecipesService.deleteRecipe(knexInstance, req.params.id)
            .then( () => {
                res.status(204).end()
            })
            .catch(next)

        logger.info(`Recipe with id ${id} deleted.`)
        res
            .status(204)
            .end()
    })

module.exports = recipesRouter