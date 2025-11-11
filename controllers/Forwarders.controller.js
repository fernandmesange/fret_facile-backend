import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { upload } from './../middlewares/uploadMiddleware.js';
import fs from 'fs';

dotenv.config();


export const getForwarder = async (req, res) => {
    try{
        console.log(req.user);
        const id = req.user.id;
        const user = await Forwarders.findById(id);

        if(!user){
            return res.status(404).json({ message: 'Forwarder not found' });
        }
        res.status(200).json(user);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


export const register = async (req, res) => {
    try{
        const { email, password, fullname,location, country, phone_number } = req.body;
        
        if(!req.file){
            return res.status(400).json({ message: 'Document is required' });
        }
        

       if(!email || !password || !fullname || !location || !country || !phone_number){
            console.log('All fields are required');
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingForwarder = await Forwarders.findOne({ email });

        if(existingForwarder){
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'raw', 
            folder: 'forwarders/documents', // dossier "virtuel" dans Cloudinary (optionnel)
            public_id: `doc_${Date.now()}`    // nom du fichier souhaité (optionnel)
          });

        const document = result.secure_url;

        const newForwarder = await Forwarders.create({ email, password: hashedPassword, fullname,location, country, phone_number ,document});

        fs.unlink(req.file.path,(err) => {
            if(err) console.error(err);
            console.log('File deleted');
        })

        res.status(201).json({ message: 'Forwarders registered successfully'});
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
};


export const login = async (req, res) => {
    try{
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({error: 'All fields are required'});
        }

        const forwarder = await Forwarders.findOne({email});

        if(!forwarder){
            return res.status(400).json({error: 'Forwarder not found'});
        }

        const isMatch = await bcrypt.compare(password, forwarder.password);

        if(!isMatch){
            return res.status(400).json({error: 'Invalid credentials'});
        }

        const accessToken = jwt.sign({id: forwarder._id,email: forwarder.email, role: 'forwarder'}, process.env.JWT_SECRET,{expiresIn: '1d'});

        res.status(200).json({message: 'Login successful',accessToken});

    }catch(error){
        console.log(error);
        res.status(400).json({error: error.message});
    }
}
