import mongoose from 'mongoose'

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(String(process.env.MONGO_URL))
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error(error)
  }

}
