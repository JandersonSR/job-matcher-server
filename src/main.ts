import cors from 'cors'
import "dotenv/config"
import express from 'express'
import { connectToDatabase } from './database'
import routes from './routes'

process.on("unhandledRejection", (reason) => {
  console.error("Erro não tratado:", reason)
})

const app = express()
const port = process.env.PORT || 3000
const ip = process.env.IP || 'http://localhost'


app.use(cors())
// Adiciona o middleware para o parsing do JSON
app.use(express.json())
app.use(routes)
connectToDatabase()

app.listen(Number(port), ip, () => {
  console.log(`Server running at ${ip}:${port}`)
})
