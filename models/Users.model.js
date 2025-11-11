import mongoose from 'mongoose';

const options = { discriminatorKey: 'role', timestamps:true};


const BaseUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'SECRET'], required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'BANNED'], default: 'INACTIVE' },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpires: { type: Date, default: null },
}, options);

export const User = mongoose.model('User', BaseUserSchema);

const ClientUserSchema = new mongoose.Schema({
    country: { type: String, required: true },
    workSituation: {type: String, enum: ['Entrepreneur','Salarié', "All"] , required: true},
    birthDate: { type: Date, required: true },
},options);

export const ClientUser = User.discriminator('client', ClientUserSchema);


const ForwarderSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    document: { type: String, required: true },
  }, options);

export const Forwarder = User.discriminator('forwarder', ForwarderSchema);



const AdminSchema = new mongoose.Schema({
    roleLevel: { type: Number, required: true }, 
    // RoleLevel : niveau d'autorisation par exemple
  }, options);
  
export const Admin = User.discriminator('admin', AdminSchema);


