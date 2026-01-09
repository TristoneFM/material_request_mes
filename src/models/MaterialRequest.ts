import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialRequest extends Document {
  _id: mongoose.Types.ObjectId;
  plantCode: string;
  sapMaterial: string;
  stationName: string;
  macAddress: string;
  requestTime: Date;
  quantity: number;
  type: string;
  area: string;
  responseTime?: Date;
  status: string;
}

const MaterialRequestSchema: Schema = new Schema({
  plantCode: { type: String, required: true },
  sapMaterial: { type: String, required: true },
  stationName: { type: String, required: true },
  macAddress: { type: String, required: true },
  requestTime: { type: Date, required: true },
  quantity: { type: Number, required: true },
  type: { type: String, required: true },
  area: { type: String, required: true },
  responseTime: { type: Date },
  status: { type: String, required: true },
});

export default mongoose.models.MaterialRequest || 
  mongoose.model<IMaterialRequest>('MaterialRequest', MaterialRequestSchema, 'materialrequests');

