import mongoose from "mongoose"

const vagaSchema = new mongoose.Schema({}, { strict: false, timestamps: true })

export const VagaModel = mongoose.model('Vaga', vagaSchema)
