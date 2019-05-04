import 'dotenv/config'
import express from 'express'
import connectDb from './config/db'
import {
    routeUser,
    routePost,
    routeProfile,
    routerAuth
} from './routes/index'
import {
    body
} from 'express-validator/check';
const app = express()


//conect Database
connectDb()


//Init Midderware
app.use(express.json({
    extended: false
}))
app.get('/', (req, res) => res.send('API Running'))

//Define Route
app.use('/api/users', routeUser)
app.use('/api/auth', routerAuth)
app.use('/api/profile', routeProfile)
app.use('/api/posts', routePost)

console.log('process.env.PORT ::', process.env.PORT)
app.listen(process.env.PORT, () => console.log(`Server startrd on port ${process.env.PORT}`))