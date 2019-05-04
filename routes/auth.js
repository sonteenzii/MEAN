import express from 'express'
import auth from '../midderware/auth'
import userRepository from '../models/user/user.repository'
import {
    check,
    validationResult
} from 'express-validator/check'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = express.Router()


//route     GET api/auth
//@desc     Authenticate user & get token
//@access   Public

router.get('/', auth, async (req, res) => {
    try {
        const user = await userRepository.findById(req.user.id).select('-password')
        res.json(user)
    } catch (error) {
        console.log(err.message)
        res.status(500).send('Server Error')
    }
})


//route     POST api/auth
//@desc     Authenticate user & get token
//@access   Public

const checkData = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password id required').exists()
]

router.post('/', checkData, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        })
    }
    const {
        email,
        password
    } = req.body

    try {
        const finduser = await userRepository.findOne({
            email
        })

        if (!finduser) {
            return res.status(400).json({
                errors: [{
                    msg: 'Invaild Credentials'
                }]
            })
        }

        const isMatch = await bcrypt.compare(password, finduser.password)

        if (!isMatch) {
            return res.status(400).json({
                errors: [{
                    msg: 'Invaild Credentials'
                }]
            })
        }

        const payload = {
            user: {
                id: finduser._id
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