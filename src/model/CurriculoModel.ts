import mongoose from "mongoose"


const curriculoSchema = new mongoose.Schema({
  resultado: String,
  status: String
}, { strict: false, timestamps: true })

export const CurriculoModel = mongoose.model('Curriculo', curriculoSchema)
