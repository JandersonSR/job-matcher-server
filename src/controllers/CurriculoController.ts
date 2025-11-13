import axios from "axios"
import { Router, Response, Request } from "express"
import { ObjectId } from "mongodb"
import multer from "multer"
import { CurriculoModel } from "../model/CurriculoModel"

const CurriculoController = Router()
const upload = multer() // guarda em memória

CurriculoController.post("/upload", upload.single("file"), async (request: Request, response: Response) => {
  try {
    console.log("Recebido upload de currículo")

    const email = request.body.email
    if (!email) return response.send_badRequest("E-mail é obrigatório.")
    if (!request.file) return response.send_badRequest("Nenhum arquivo enviado.")

    const conteudo = request.file.buffer.toString("utf-8")

    console.log("🔍 Salvando currículo no banco...")
    const result = await CurriculoModel.findOneAndUpdate({ email }, {
      email,
      conteudo,
      status: "pendente",
      createdAt: new Date()
    }, { upsert: true, new: true })

    setImmediate(() => {
      scrapVagas(2)
      processarCurriculos()
    })

    return response.send_ok("Currículo salvo com sucesso", { id: result._id })
  } catch (err) {
    console.error(err)
    return response.send_internalServerError("Erro ao salvar currículo")
  }
})

CurriculoController.get("/vagas", async (request: Request, response: Response) => {
  try {
    console.log("Buscando vagas para o e-mail...")

    const email = request.query.email as string
    if (!email) return response.send_badRequest("E-mail é obrigatório.")

    const curriculo = await CurriculoModel.findOne({ email })
    if (!curriculo) return response.send_notFound("Currículo não encontrado.")

    setImmediate(() => {
      processarCurriculos()
    })

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
    console.log("Consultando status do currículo...", { id })


    // setImmediate(() => {
    //   processarCurriculos()
    // })

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

CurriculoController.get("/processar-curriculos", async (request: Request, response: Response) => {
  try {
    console.log("Iniciando processamento manual de currículos...")
    setImmediate(() => {
      scrapVagas(2)
      processarCurriculos()
    })
    return response.send_ok("Processamento iniciado com sucesso")
  } catch (err) {
    console.error(err)
    return response.send_internalServerError("Erro ao iniciar processamento", { err })
  }
})

export default CurriculoController

// Dispara o scraping sem aguardar a resposta
function scrapVagas(maxPages = 2) {
  console.log("Disparando scraping de vagas (modo assíncrono)...")

  axios
    .get(`${process.env.PROCESSING_SERVICE_URL}/scrap-vagas`, {
      params: { max_pages: maxPages },
      timeout: 0
    })
    .then(() => {
      console.log("[SCRAP VAGAS] ✅ Requisição enviada com sucesso (execução em background)")
    })
    .catch((error: any) => {
      console.error("[SCRAP VAGAS] ⚠️ Falha ao disparar scraping:", error.message)
      if (error.response) {
        console.error("Resposta do servidor:", error.response.data)
      }
    })
}

// Dispara o processamento de currículos sem aguardar o resultado
function processarCurriculos() {
  console.log("Disparando processamento de currículos (modo assíncrono)...")

  axios
    .get(`${process.env.PROCESSING_SERVICE_URL}/processar-curriculos`, {
      timeout: 0,
    })
    .then(() => {
      console.log("[PROCESSAR CURRÍCULOS] ✅ Requisição enviada com sucesso (execução em background)")
    })
    .catch((error: any) => {
      console.error("[PROCESSAR CURRÍCULOS] ⚠️ Falha ao disparar processamento:", error.message)
      if (error.response) {
        console.error("Resposta do servidor:", error.response.data)
      }
    })
}
