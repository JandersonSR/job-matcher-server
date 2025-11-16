import mongoose from "mongoose"

const curriculoSchema = new mongoose.Schema({
  conteudo: String,
  resultado: mongoose.Schema.Types.Mixed,
  status: String,
  email: String,
}, { strict: false, timestamps: true })

export const CurriculoModel = mongoose.model('Curriculo', curriculoSchema)
