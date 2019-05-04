import express from 'express'
const router = express.Router()
import {
    check,
    validationResult
} from 'express-validator/check'
import userRepository from '../models/user/user.repository'
import gravatar from 'gravatar'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


//route     POST api/users
//@desc     Register user
//@access   Public
const checkData = [check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({
        min: 6
    }),

]

router.post('/', checkData, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        })
    }
    const {
        name,
        email,
        password
    } = req.body

    try {
        const finduser = await userRepository.findOne({
            email
        })

        if (finduser) {
            res.status(400).json({
                errors: [{
                    msg: 'User already exists'
                }]
            })
        }
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        const salt = await bcrypt.genSalt(10)

        const hastPassword = await bcrypt.hash(password, salt)

        const newData = {
            ...req.body,
            avatar,
            password: hastPassword
        }
        const createUser = await userRepository.create(newData)
        const payload = {
            user: {
                id: createUser._id
            }
        }

        const jwtSign = await jwt.sign(payload, process.env.jwtSecret, {
            expiresIn: process.env.expiresInTime
        })
        if (jwtSign) {
            res.json({
                jwtSign
            })
        }

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server error')
    }

})



export default router