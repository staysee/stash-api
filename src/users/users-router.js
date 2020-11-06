const express = require('express')
const path = require('path')
const UsersService = require('./users-service')
const AuthService = require('../auth/auth-service')


const usersRouter = express.Router()
const jsonBodyParser = express.json()

usersRouter
    .route('/')
    .get(jsonBodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getAllUsers(knexInstance)
            .then(users => {
                res.json(users.map(UsersService.serializeUser))
            })
            .catch(next)
    })
    .post(jsonBodyParser, (req, res, next) => {
        const { username, firstname, lastname, password } = req.body
        const newUser = { username, firstname, lastname, password }

        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                return res.status(400).json({
                    error: `Missing '${key}' in request body`
                })
            }
        }

        const passwordError = UsersService.validatePassword(password)

        if (passwordError)
            return res.status(400).json({ error: passwordError})

        UsersService.hasUserWithUsername(req.app.get('db'), username)
            .then(hasUserWithUsername => {
                if (hasUserWithUsername)
                    return res.status(400).json({ error: `Username already taken` })

                    return UsersService.hashPassword(password)
                        .then(hashedPassword => {
                            const newUser = {
                                username,
                                password: hashedPassword,
                                firstname,
                                lastname,
                                // date_created: 'now()'
                            }
                        

                            return UsersService.insertUser(
                                req.app.get('db'), newUser
                            )
                            .then(user => {
                                const sub = user.username
                                const payload = { user_id: user.id}
                                res.status(201)
                                .location(path.posix.join(req.originalUrl, `/${user.id}`))
                                .json({
                                    authToken: AuthService.createJwt(sub, payload)
                                })

                            })
                        })
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
                    return res.status(404).json({ error: `User doesn't exist` })
                }
                res.user = user
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
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
            error: `Request body must contain either 'username', 'firstname', 'lastname', or 'password'`
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