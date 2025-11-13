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
    console.log('Recebido upload de currículo')
    if (!request.file) {
      return response.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    const conteudo = request.file.buffer.toString('utf-8') // Simples. Ideal seria extrair texto (Python ou serviço extra)

    // Chama scraping
    await scrapVagas(2)

    // Processa currículos
    await processarCurriculos()

    // try {
    //   await axios.get(`${process.env.PROCESSING_SERVICE_URL}/health`)
    // } catch (err) {
    //   console.error('Erro ao iniciar processamento do currículo:', err)
    // }

    console.log('Salvando currículo no banco de dados', { conteudoLength: conteudo.length })
    const result = await CurriculoModel.create({
      conteudo,
      status: 'pendente',
      createdAt: new Date(),
    })
    console.log('Currículo salvo com ID:', result._id)
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

    try {
      await processarCurriculos()

    } catch (err) {
      console.error('Erro ao iniciar processamento do currículo/vagas:', err)
    }

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

// Verificar status do currículo
CurriculoController.get('/start-process', async (request: Request, response: Response) => {
  try {
    // Chama scraping
    await scrapVagas(2)

    // Processa currículos
    await processarCurriculos()

    return response.send_ok('Processamento iniciado com sucesso')
  } catch (err) {
    console.error(err)
    return response.send_internalServerError('Erro ao iniciar processamento', { err })
  }
})

export default CurriculoController


async function scrapVagas(maxPages = 2) {
  try {
    const response = await axios.get(`${process.env.PROCESSING_SERVICE_URL}/scrap-vagas`, {
      params: { max_pages: maxPages },
      timeout: 30000, // 30s de timeout
    })
    console.log("[SCRAP VAGAS] ✅", response.data)
  } catch (error: any) {
    console.error("[SCRAP VAGAS] ❌ Erro:", error.message)
    if (error.response) {
      console.error("Resposta do servidor:", error.response.data)
    }
  }
}

// Função para chamar rota de processamento de currículos
async function processarCurriculos() {
  try {
    const response = await axios.get(`${process.env.PROCESSING_SERVICE_URL}/processar-curriculos`, {
      timeout: 30000,
    })
    console.log("[PROCESSAR CURRÍCULOS] ✅", response.data)
  } catch (error: any) {
    console.error("[PROCESSAR CURRÍCULOS] ❌ Erro:", error.message)
    if (error.response) {
      console.error("Resposta do servidor:", error.response.data)
    }
  }
}
