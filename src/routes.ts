import { Request, Response, Router } from 'express'
import responser from 'responser'
import CurriculoController from './controllers/CurriculoController'

const app = Router()
app.use(responser)

app.use('/curriculo', CurriculoController)

app.use('/status', (request: Request, response: Response) => {
  response.send_ok('API is running')
})

export default app