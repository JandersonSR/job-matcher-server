import { Router } from 'express'
import responser from 'responser'
import CurriculoController from './controllers/CurriculoController'

const app = Router()
app.use(responser)

app.use('/curriculo', CurriculoController)

export default app