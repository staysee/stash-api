const path = require('path')
const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const xss = require('xss')
const RecipesService = require('./recipes-service')
const { end } = require('../logger')

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
                    .location(path.posix.join(req.originalUrl + `/${recipe.id}`))
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
        const { recipe } = res;
        res.json({
            id: recipe.id,
            title: xss(recipe.title),
            ingredients: xss(recipe.ingredients),
            instructions: xss(recipe.instructions),
            meal_type: recipe.meal_type,
            image_url: recipe.image_url,
            date_created: recipe.date_created
        })
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        return RecipesService.deleteRecipe(knexInstance, req.params.id)
            .then( () => {
                return res.status(204).json({ message: `Recipe with id ${req.params.id} was deleted.`})
            })
            .catch(next)

        logger.info(`Recipe with id ${id} deleted.`)

    })
    .patch(jsonParser, (req, res, next) => {
        const { title, ingredients, instructions, meal_type, image_url } = req.body
        const recipeToUpdate = { title, ingredients, instructions, meal_type, image_url }
        const knexInstance = req.app.get('db')

        const numberOfValues = Object.values(recipeToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'ingredients', 'instructions', 'image_url'`
                }
            })
        }

        RecipesService.updateRecipe(knexInstance, req.params.id, recipeToUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = recipesRouter