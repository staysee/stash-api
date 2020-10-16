const path = require('path')
const express = require('express')
const xss = require('xss')
const UsersService = require('./users-service')
const { json } = require('express')
const bcrypt = require('bcryptjs')

const usersRouter = express.Router()
const jsonBodyParser = express.json()

const serializeUser = user => ({
    id: user.id,
    username: xss(user.username),
    firstname: xss(user.firstname),
    lastname: xss(user.lastname),
    date_created: user.date_created,
    recipes: user.recipes,
    meals: user.meals
})

usersRouter
    .route('/')
    .get(jsonBodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getAllUsers(knexInstance)
            .then(users => {
                // res.json(users.map(serializeUser))
                res.json(users)
            })
            .catch(next)
    })
    .post(jsonBodyParser, async (req, res, next) => {
        const { username, firstname, lastname, password } = req.body
        const newUser = { username, firstname, lastname }

        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        newUser.password = await bcrypt.hash(password, 12)

        const knexInstance = req.app.get('db')
        UsersService.insertUser(knexInstance, newUser)
            .then(user => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${user.id}`))
                    .json(serializeUser(user))
            })
            .catch(next)
    })

usersRouter
    .route('/:user_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getById(knexInstance, req.params.user_id)
            .then(user => {
                if (!user) {
                    return res.status(404).json({
                        error: { message: `User doesn't exist` }
                    })
                }
                res.user = user
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        // res.json(serializeUser(res.user))
        res.json(res.user)
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.deleteUser(knexInstance, req.params.user_id)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonBodyParser, (req, res, next) => {
        const { username, firstname, lastname, password } = req.body
        const userToUpdate = { username, firstname, lastname, password }

        const numberOfValues = Object.values(userToUpdate).filter(Boolean).length
        if (numberOfValues === 0)
        return res.status(400).json({
            error: {
                message: `Request body must contain either 'username', 'firstname', 'lastname', or 'password'`
            }
        })

        const knexInstance = req.app.get('db')
        UsersService.updateUser(knexInstance, req.params.user_id, userToUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

usersRouter
    .route('/:user_id/recipes')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getUserRecipes(knexInstance, req.params.user_id)
            .then(userRecipes => {
                res.json(userRecipes)
            })
            .catch(next)
    })


module.exports = usersRouter