require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { CLIENT_ORIGIN, NODE_ENV } = require('./config')

const recipesRouter = require('./recipes/recipes-router')
const mealsRouter = require('./meals/meals-router')
const usersRouter = require('./users/users-router')
const authRouter = require('./auth/auth-router')

const app = express()

const morganOption = (NODE_ENV === 'production') 
    ? 'tiny' 
    : 'common'

const allowedOrigins = ['http://localhost:3000', 'https://stash.staysee.vercel.app', 'https://stash-zeta.vercel.app']
const corsOptionsDelegate = function (req, callback) {
    let corsOptions;
    if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true }
    } else {
        corsOptions = { origin: false }
    }
    callback(null, corsOptions)
}

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors(corsOptionsDelegate))
app.use(express.json())

app.use('/api/recipes', recipesRouter)
app.use('/api/meals', mealsRouter)
app.use('/api/users', usersRouter)
app.use('/api/auth', authRouter)



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