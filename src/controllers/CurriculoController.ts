import axios from "axios"
import { Router, Response, Request } from "express"
import { ObjectId } from "mongodb"
import multer from "multer"
import { CurriculoModel } from "../model/CurriculoModel"

const CurriculoController = Router()
const upload = multer() // guarda em memória

CurriculoController.post("/upload", upload.single("file"), async (request: Request, response: Response) => {
  try {
    console.log("📥 Recebido upload de currículo")

    const email = request.body.email
    if (!email) return response.send_badRequest("E-mail é obrigatório.")
    if (!request.file) return response.send_badRequest("Nenhum arquivo enviado.")

    const conteudo = request.file.buffer.toString("utf-8")

    console.log("🔍 Salvando currículo no banco...")
    const result = await CurriculoModel.create({
      email,
      conteudo,
      status: "pendente",
      createdAt: new Date(),
    })

    // inicia scraping e processamento
    await scrapVagas(2)
    await processarCurriculos()

    return response.send_ok("Currículo salvo com sucesso", { id: result._id })
  } catch (err) {
    console.error(err)
    return response.send_internalServerError("Erro ao salvar currículo")
  }
})

CurriculoController.post("/atualizar", upload.single("file"), async (request: Request, response: Response) => {
  try {
    const email = request.body.email
    if (!email) return response.send_badRequest("E-mail é obrigatório.")
    if (!request.file) return response.send_badRequest("Nenhum arquivo enviado.")

    const conteudo = request.file.buffer.toString("utf-8")

    const existente = await CurriculoModel.findOne({ email })
    if (!existente) {
      return response.send_notFound("Nenhum currículo encontrado para este e-mail.")
    }

    await CurriculoModel.updateOne(
      { email },
      { $set: { conteudo, status: "pendente", updatedAt: new Date() } }
    )

    await scrapVagas(2)
    await processarCurriculos()

    return response.send_ok("Currículo atualizado com sucesso")
  } catch (err) {
    console.error(err)
    return response.send_internalServerError("Erro ao atualizar currículo")
  }
})

CurriculoController.get("/vagas", async (request: Request, response: Response) => {
  try {
    const email = request.query.email as string
    if (!email) return response.send_badRequest("E-mail é obrigatório.")

    const curriculo = await CurriculoModel.findOne({ email })
    if (!curriculo) return response.send_notFound("Currículo não encontrado.")

    return response.send_ok("Vagas recuperadas com sucesso", {
      resultado: curriculo.resultado || [],
    })
  } catch (err) {
    console.error(err)
    return response.send_internalServerError("Erro ao buscar vagas.")
  }
})

CurriculoController.get("/status/:id", async (request: Request, response: Response) => {
  try {
    const id = request.params.id
    await processarCurriculos()

    const curriculo = await CurriculoModel.findOne({ _id: new ObjectId(id) })
    if (!curriculo) return response.send_notFound("Currículo não encontrado")

    return response.send_ok("Currículo encontrado", {
      status: curriculo.status,
      resultado: curriculo.resultado || null,
    })
  } catch (err) {
    console.error(err)
    return response.send_internalServerError("Erro ao consultar status")
  }
})

CurriculoController.get("/start-process", async (request: Request, response: Response) => {
  try {
    await scrapVagas(2)
    await processarCurriculos()
    return response.send_ok("Processamento iniciado com sucesso")
  } catch (err) {
    console.error(err)
    return response.send_internalServerError("Erro ao iniciar processamento", { err })
  }
})

export default CurriculoController

async function scrapVagas(maxPages = 2) {
  try {
    const response = await axios.get(`${process.env.PROCESSING_SERVICE_URL}/scrap-vagas`, {
      params: { max_pages: maxPages },
      timeout: 30000,
    })
    console.log("[SCRAP VAGAS]", response.data)
  } catch (error: any) {
    console.error("[SCRAP VAGAS] Erro:", error.message)
    if (error.response) console.error("Resposta do servidor:", error.response.data)
  }
}

async function processarCurriculos() {
  try {
    const response = await axios.get(`${process.env.PROCESSING_SERVICE_URL}/processar-curriculos`, {
      timeout: 30000,
    })
    console.log("[PROCESSAR CURRÍCULOS]", response.data)
  } catch (error: any) {
    console.error("[PROCESSAR CURRÍCULOS] Erro:", error.message)
    if (error.response) console.error("Resposta do servidor:", error.response.data)
  }
}
