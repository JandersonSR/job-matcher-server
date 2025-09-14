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

app.use(cors())
// Adiciona o middleware para o parsing do JSON
app.use(express.json())
app.use(routes)
connectToDatabase()

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
