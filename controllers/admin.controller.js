
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body } from "express-validator";
import nodemailerTransport from './../config/nodeMailerTransport.js';
import crypto from 'crypto';

dotenv.config();




export const register = async (req, res) => {
    try{
        const { email, password, fullname, phone_number } = req.body;

        if(!email || !password || !fullname || !phone_number){
            console.log('All fields are required');
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await Admin.findOne({ email });

        if(existingUser){
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Générer un token
        const token = crypto.randomBytes(32).toString("hex");

        const newUser = await Admin.create({ email, password: hashedPassword, fullname, phone_number, verificationToken: token, verificationTokenExpires: Date.now() + 3600000 });

        const verificationLink = `${process.env.FRONTEND_URL}/admin/verification?token=${token}`;

        const emailData = {
            from: process.env.EMAIL_FROM,
            to: newUser.email,
            subject: "Vérification de votre compte",
            html:`
            <!DOCTYPE html>
            <html>
            <body>
              <p>Vous etes maintenant admin sur <strong>Fret Facile</strong> !</p>
              <p>Pour compléter votre inscription, cliquez sur le lien ci-dessous pour activer votre compte :</p>
              <a href="${verificationLink}" style="color: #007BFF; font-size: 18px;">Vérifier mon email</a>
              <p>Ou copiez ce lien dans votre navigateur : <br>${verificationLink}</p>
            </body>
            </html>
          `,
        }
        await nodemailerTransport.sendMail((emailData));


        res.status(201).json({ message: 'Admin registered successfully'});
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

        const user = await Admin.findOne({email});

        if(!user){
            return res.status(400).json({error: 'User not found'});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({error: 'Invalid credentials'});
        }

        const accessToken = jwt.sign({id: user._id,email: user.email, role:'admin'}, process.env.JWT_SECRET,{expiresIn: '1d'});
        res.status(200).json({message: 'Login successful',accessToken});

    }catch(error){
        console.log(error);
        res.status(400).json({error: error.message});
    }
}


export const verificationToken = async (req,res) => {

    const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token de vérification manquant." });
  }

  try {
    const user = await Admin.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }, // Le token doit être valide
    });

    if(!user) {
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }

    console.log(user);

    if(user.status == "ACTIVE") {
      return res.status(400).json({ message: "Email déjà vérifié." });
    }

    if(user.status == "BANNED") {
      return res.status(400).json({ message: "Vous avez été banni." });;
    }

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }

    user.status = "ACTIVE";
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.status(200).json({ message: "Email vérifié avec succès !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur interne.", error });
  }
}


export const getAdminInfo = async (req, res) => {
    try{
        const id = req.user.id;

        const admin = await Admin.findById(id);
        if(!admin){
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json(admin);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

