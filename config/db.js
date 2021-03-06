import mongoose from 'mongoose'
const config = require('config')
const db = config.get('mongoURI')

const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useCreateIndex: true
        })
        console.log('MongoDB Connected...')
    } catch (error) {
        console.error(error.message)
        //Exit process witg failure
        process.exit(1)
    }
}

export default connectDB