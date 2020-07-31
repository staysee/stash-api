require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const winston = require('winston')
const { NODE_ENV } = require('./config')
const { v4: uuid } = require('uuid')

const app = express()

const morganOption = (NODE_ENV === 'production') 
    ? 'tiny' 
    : 'common'

// set up winston
const logger = winston.createLogger({
    level: 'info',
    formate: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'info.log' })
    ]
})
if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }))
}
// end winston setup

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json())


const recipes = [
    {
        "id": "1testRecipeId",
        "title": "Egg Scramble",
        "ingredients": ["eggs", "salt", "pepper"],
        "instructions": "Blah Blah blah Blah",
        "type": "Breakfast",
        "imageURL": "https://via.placeholder.com/100",
        "createdBy": "userid1"
    },
    {
        "id": "2testRecipeId",
        "title": "Salad",
        "ingredients": ["eggs", "lettuce", "tomatoes", "dressing"],
        "instructions": "Blah Blah blah Blah",
        "type": "Lunch",
        "imageURL": "https://via.placeholder.com/100",
        "createdBy": "userid1"
    },
]

app.get('/api/recipes', (req, res) => {
    //return list of recipes
    res.json(recipes)
})
app.get('/api/recipes/:id', (req, res) => {
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

app.post('/api/recipes', (req, res) => {
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

app.delete('/api/recipes/:id', (req, res) => {
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

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' }}
    } else {
        console.error(error)
        response = { message: error.messages, error}
    }
    res.status(500).json(response)
})


module.exports = app