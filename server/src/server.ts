import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { AppDataSource } from './db/data-source'

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully')

    const PORT = process.env.PORT || 8080
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error)
  })
