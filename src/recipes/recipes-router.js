const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { recipes } = require('../store')

const recipesRouter = express.Router()
const bodyParser = express.json()

recipesRouter
    .route('/recipes')
    .get((req, res) => {
        //return list of recipes
        res.json(recipes)
    })
    .post(bodyParser, (req, res) => {
        // get the data
        const { title, ingredients, instructions, type, imageURL } = req.body
        
        if (!title) {
            return res
                .status(400)
                .send('Title required');
        }
        if (!ingredients) {
            return res
                .status(400)
                .send('Ingredients required');
        }
        if (!instructions) {
            return res
                .status(400)
                .send('Instructions required');
        }
        if (!type) {
            return res
                .status(400)
                .send('Type required');
        }
        if (!imageURL) {
            return res
                .status(400)
                .send('Image URL required');
        }
    
        // if validations are passed, get an id
        const id = uuid()
        const newRecipe = {
            id,
            title,
            ingredients,
            instructions,
            imageURL
        }
    
        recipes.push(newRecipe)
    
        // log the recipe
        logger.info(`Recipe created with id ${id}`)
        // send the response
        res
            .status(201)
            .location(`http://localhost:8000/recipes/${id}`)
            .json(newRecipe)
    })

recipesRouter
    .route('/recipes/:id')
    .get((req, res) => {
        const { id } = req.params
        const recipe = recipes.find( recipe => recipe.id === id)

        if (!recipe){
            logger.error(`Recipe with id ${id} not found`)
            return res
                .status(404)
                .send('Recipe Not Found')
        }
        res.json(recipe)
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