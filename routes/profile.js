import express from 'express'
import auth from '../midderware/auth'
import profileRepository from '../models/profile/profile.repository'
import userRepository from '../models/user/user.repository'
import {
    check,
    validationResult
} from 'express-validator/check'

import request from 'request'

const router = express.Router()
//route     GET api/profile/me
//@desc     Get current users profile
//@access   Private

router.get('/me', auth, async (req, res) => {
    try {
        const findProfile = await profileRepository.findOne({
            users: req.user.id
        }).populate('user', ['name', 'avatar'])

        if (!findProfile) {
            return res.status(400).json({
                msg: "There is no profile for this user"
            })
        }
        res.json(findProfile)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server error')
    }
})

//route     POST api/profile/
//@desc     Create or update user profile
//@access   Private

const checkDataPost = [check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty(),
]

router.post('/', [auth, checkDataPost], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        })
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubuername,
        youtube,
        facebook,
        instagram,
        skills
    } = req.body
    console.log('Check')
    // Build profile object
    const profileFields = {}
    profileFields.user = req.user.id
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio
    if (status) profileFields.status = status
    if (githubuername) profileFields.githubuername = githubuername
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim())
    }
    // Build sical object
    profileFields.social = {}
    if (facebook) profileFields.social.facebook = facebook
    if (youtube) profileFields.social.youtube = youtube
    if (instagram) profileFields.social.instagram = instagram

    try {
        console.log('check try', req.user.id)
        const findProfile = await profileRepository.findOne({
            user: req.user.id
        })
        console.log("findProfile ::", findProfile)

        if (findProfile) {
            //update
            const findProfileAndUpdate = await profileRepository.findOneAndUpdate({
                user: req.user.id
            }, {
                $set: profileFields
            }, {
                new: true
            })

            return res.json(findProfileAndUpdate)
        }
        // Create
        const newData = {
            ...profileFields
        }

        console.log('newData ::', newData)
        const createProfile = await profileRepository.create(
            newData
        )

        res.send(createProfile)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

//route     GET api/profile/
//@desc     Get All profiles
//@access   Public

router.get('/', async (req, res) => {
    try {
        const profile = await profileRepository.find().populate('user', ['name', 'avatar'])
        res.send(profile)
    } catch (error) {
        console.error(error.message)
        res.send(500).send('Server Error')
    }
})


//route     GET api/profile/user/:user_id
//@desc     Get profile by user ID
//@access   Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await profileRepository.findOne({
            user: req.params.user_id
        }).populate('user', ['name', 'avatar'])

        if (!profile) return res.status(400).json({
            msg: "Profile not found"
        })

        res.send(profile)
    } catch (error) {
        console.error(error.message)
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                msg: "Profile not found"
            })
        }
        res.send(500).send('Server Error')
    }
})

//route     DELETE api/profile/user/:user_id
//@desc    Delete profile ,user & post
//@access   Public

router.delete('/', auth, async (req, res) => {
    try {
        //@todo - remove users posts

        // Remove profile
        await profileRepository.findOneAndRemove({
            user: req.user.id
        })

        //Remove user
        await userRepository.findOneAndRemove({
            _id: req.user.id
        })
        res.send({
            msg: "User deleted"
        })
    } catch (error) {
        console.error(error.message)
        res.send(500).send('Server Error')
    }
})

//route     PUT api/profile/experience/
//@desc     add profile experience
//@access   Public

const checkDataPutExp = [check('title', 'Title is required').not().isEmpty(),
    check('company', 'company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
]


router.put('/experience', [auth, checkDataPutExp], async (req, res) => {
    const errors = validationResult(req)
    if (!errors) {
        return res.status(400).json({
            errors: errors.array()
        })
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await profileRepository.findOne({
            user: req.user.id
        })

        await profile.experience.unshift(newExp)
        const createExp = await profileRepository.create(profile)
        res.json(createExp)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

//route     DELETE api/profile/experience/:exp_id
//@desc     Delete experience from profile
//@access   Public

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await profileRepository.findOne({
            user: req.user.id
        })

        //get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)

        profile.experience.splice(removeIndex, 1)
        await profile.save()

        res.json(profile)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})


//route     PUT api/profile/education/
//@desc     add profile education
//@access   Public

const checkPutEdu = [check('school', 'school is required').not().isEmpty(),
    check('degree', 'degree is required').not().isEmpty(),
    check('fieldofstudy', 'fieldofstudy of study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
]


router.put('/education', [auth, checkPutEdu], async (req, res) => {
    const errors = validationResult(req)
    if (!errors) {
        return res.status(400).json({
            errors: errors.array()
        })
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await profileRepository.findOne({
            user: req.user.id
        })

        await profile.education.unshift(newEdu)

        const createExp = await profileRepository.create(profile)

        res.json(createExp)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

//route     DELETE api/profile/education/:edu_id
//@desc     Delete education from profile
//@access   Public

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await profileRepository.findOne({
            user: req.user.id
        })

        //get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)

        profile.education.splice(removeIndex, 1)
        await profile.save()

        res.json(profile)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

//route     GET api/profile/github/:username
//@desc     Get user repos form Github
//@access   Public

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `http://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${process.env.githubSecret}&client_secret=${process.env.githubClientId}`,
            method: 'GET',
            headers: {
                'user-agent': 'node.js'
            }
        }
        request(options, (error, response, body) => {
            if (error) console.error(error)
            if (response.statusCode !== 200) {
                return res.status(404).json({
                    msg: "No Gitgub profile found"
                })
            }
            res.json(JSON.parse(body))
        })
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})


export default router