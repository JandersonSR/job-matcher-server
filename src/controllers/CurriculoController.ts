import axios from 'axios'
import { Router, Response, Request } from 'express'
import { ObjectId } from 'mongodb'
import multer from 'multer'
import { CurriculoModel } from '../model/CurriculoModel'

const CurriculoController = Router()
const upload = multer() // guarda em memória

// Upload do currículo
CurriculoController.post('/upload', upload.single('file'), async (request: Request, response: Response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    const conteudo = request.file.buffer.toString('utf-8') // Simples. Ideal seria extrair texto (Python ou serviço extra)

    const result = await CurriculoModel.create({
      conteudo,
      status: 'pendente',
      createdAt: new Date(),
    })

    try {
      await axios.get(`${process.env.PROCESSING_SERVICE_URL}/health`)
    } catch (err) {
      console.error('Erro ao iniciar processamento do currículo:', err)
    }

    return response.send_ok('Currículo salvo com sucesso', { id: result._id })
  } catch (err) {
    console.error(err)
    return response.send_internalServerError('Erro ao salvar currículo')
  }
})

// Verificar status do currículo
CurriculoController.get('/status/:id', async (request: Request, response: Response) => {
  try {
    const id = request.params.id
    const curriculo = await CurriculoModel.findOne({ _id: new ObjectId(id) })

    if (!curriculo) {
      return response.send_notFound('Currículo não encontrado')
    }

    return response.send_ok('Currículo encontrado com sucesso', {
      status: curriculo.status,
      resultado: curriculo.resultado || null,
    })
  } catch (err) {
    console.error(err)
    return response.send_internalServerError('Erro ao consultar status')
  }
})

export default CurriculoController
