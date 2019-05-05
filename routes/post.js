import express from 'express'
import auth from '../midderware/auth'
import {
    check,
    validationResult
} from 'express-validator/check'
import postRepository from '../models/post/post.repository'
import userRepository from '../models/user/user.repository'
import profileRepository from '../models/profile/profile.repository'
const router = express.Router()


//route     POST api/posts
//@desc     creat post
//@access   Public


const checkDataGet = [check('text', 'text is required').not().isEmpty(), ]

router.post('/', [auth, checkDataGet], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        })
    }
    try {
        const user = await userRepository.findById(req.user.id).select('-password')
        const newPost = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        }

        const post = await postRepository.create(newPost)

        res.json(post)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

//route     GET api/posts
//@desc     Get all posts
//@access   Private

router.get('/', auth, async (req, res) => {
    try {
        const posts = await postRepository.find().sort({
            date: -1
        })
        res.json(posts)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

//route     GET api/posts/:id
//@desc     Get posts by id
//@access   Private

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await postRepository.findById(req.params.id)

        if (!post) {
            return res.status(404).json({
                msg: 'Post not found'
            })
        }

        res.json(post)
    } catch (error) {
        console.error(error.message)
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                msg: 'Post not found'
            })
        }
        res.status(500).send('Server Error')
    }
})


//route     DELETE api/posts/:id
//@desc     Delete posts by id
//@access   Private

router.delete('/:id', auth, async (req, res) => {
    try {
        const posts = await postRepository.findById(req.params.id)

        if (!posts) {
            return res.status(404).json({
                msg: 'Post not found'
            })
        }

        if (posts.user.toString() !== req.user.id) {
            return res.status(401).json({
                msg: 'User not authorized'
            })
        }

        await posts.remove()
        res.json({
            msg: 'Post remove'
        })

    } catch (error) {
        console.error(error.message)
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                msg: 'Post not found'
            })
        }
        res.status(500).send('Server Error')
    }
})

//route     PUT api/posts/like/:id
//@desc     Like a post
//@access   Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await postRepository.findById(req.params.id)

        //check if the post has already benn liked

        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({
                msg: "Post already liked"
            })

        }
        post.likes.unshift({
            user: req.user.id
        })

        await post.save()
        res.json(post.likes)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

//route     PUT api/posts/unlike/:id
//@desc     Like a post
//@access   Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await postRepository.findById(req.params.id)

        //check if the post has already benn liked

        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({
                msg: "Post has not yet liked"
            })

        }

        //get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)

        post.likes.splice(removeIndex, 1)
        await post.save()
        res.json(post.likes)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})


//route     POST api/posts/comment/:id
//@desc     Comment on a post
//@access   Public


const checkDataComment = [check('text', 'text is required').not().isEmpty(), ]

router.post('/comment/:id', [auth, checkDataComment], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        })
    }
    try {
        const user = await userRepository.findById(req.user.id).select('-password')

        const post = await postRepository.findById(req.params.id)
        const newComment = {

            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        }
        
        post.comments.unshift(newComment)

        await post.save()

        res.json(post.comments)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

//route     DELETE api/posts/comment/:id/comment_id
//@desc     Delete posts by id
//@access   Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await postRepository.findById(req.params.id)


        //put  out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id)

        // Make sure comment exists

        if (!comment) {
            return res.status(404).json({
                msg: "Comment does not exist "
            })
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(404).json({
                msg: "user not authorized"

            })
        }
        //get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id)
        post.comments.splice(removeIndex, 1)

        await post.save()

        res.json(post.comments)

    } catch (error) {
        console.error(error.message)
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                msg: 'Post not found'
            })
        }
        res.status(500).send('Server Error')
    }
})



export default router