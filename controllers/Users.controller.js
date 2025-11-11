import { User, ClientUser, Forwarder, Admin } from "../models/Users.model.js";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body } from "express-validator";
import nodemailerTransport from './../config/nodeMailerTransport.js';
import crypto from 'crypto';
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

dotenv.config();

export const generateVerificationCode = () => {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  return verificationCode;
}

export const register = async (req, res) => {
    try{
      const { role } = req.body;

      if(!role){
        return res.status(400).json({ message: 'Role is required' });
      }

      switch(role){
        case 'client':
          await registerClient(req, res);
          break;
        case 'forwarder':
          //await registerForwarder(req, res);
          return res.status(400).json({ message: 'Forwarder registration is not available at the moment' });
          // break;
        case 'admin':
          await registerAdmin(req, res);
          break;
        default:
          return res.status(400).json({ message: 'Invalid role' });
      }
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

const registerClient = async (req,res) => {
  try{
    const { email, fullname, password, phoneNumber, gender, country, workSituation, birthDate } = req.body;

        if(!email || !password || !fullname || !country || !birthDate || !phoneNumber || !gender || !workSituation){
            console.log('All fields are required');
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await ClientUser.findOne({ email });

        if(existingUser){
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Générer un token
        const token = crypto.randomBytes(32).toString("hex");

        const newUser = await ClientUser.create({
          email,
          password: hashedPassword,
          fullname,
          country,
          birthDate,
          phoneNumber,
          role: 'client',
          gender,
          workSituation,
          verificationToken: token,
          verificationTokenExpires: Date.now() + 3600000
         });

        const verificationLink = `${process.env.FRONTEND_URL}/verification?token=${token}`;

        const emailData = {
            from: process.env.EMAIL_FROM,
            to: newUser.email,
            subject: "Vérification de votre compte",
            html:`
            <!DOCTYPE html>
            <html>
            <body>
              <p>Merci de vous être inscrit sur <strong>Fret Facile</strong> !</p>
              <p>Pour compléter votre inscription, cliquez sur le lien ci-dessous :</p>
              <a href="${verificationLink}" style="color: #007BFF; font-size: 18px;">Vérifier mon email</a>
              <p>Ou copiez ce lien dans votre navigateur : <br>${verificationLink}</p>
            </body>
            </html>
          `,
        }
        await nodemailerTransport.sendMail((emailData));

        res.status(201).json({ message: 'User registered successfully'});
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


export const registerForwarder = async (req, res) => {
    try{
        const { email, fullname, password, phoneNumber, gender, companyName, address, country } = req.body;
        
        if(!req.file){
            return res.status(400).json({ message: 'Document is required' });
        }
        

       if(!email || !password || !fullname || !country || !phoneNumber || !gender || !companyName || !address){
            console.log('All fields are required');
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingForwarder = await Forwarder.findOne({ email });

        if(existingForwarder){
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const token = crypto.randomBytes(32).toString("hex");

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'raw', 
            folder: 'forwarders/documents', // dossier "virtuel" dans Cloudinary (optionnel)
            public_id: `doc_${Date.now()}`    // nom du fichier souhaité (optionnel)
          });

        const documentUrl = result.secure_url;

        const newForwarder = await Forwarder.create({
          email,
          password: hashedPassword,
          fullname,
          country,
          phoneNumber,
          gender,
          companyName,
          address,
          role:'forwarder',
          document: documentUrl,
          verificationToken: token,
          verificationTokenExpires: Date.now() + 3600000
        });



        fs.unlink(req.file.path,(err) => {
            if(err) console.error(err);
            console.log('File deleted');
        })

        const verificationLink = `${process.env.FRONTEND_URL}/verification?token=${token}`;

        const emailData = {
            from: process.env.EMAIL_FROM,
            to: newForwarder.email,
            subject: "Vérification de votre compte",
            html:`
            <!DOCTYPE html>
            <html>
            <body>
              <p>Merci de vous être inscrit sur <strong>Fret Facile</strong> !</p>
              <p>Pour compléter votre inscription, cliquez sur le lien ci-dessous :</p>
              <a href="${verificationLink}" style="color: #007BFF; font-size: 18px;">Vérifier mon email</a>
              <p>Ou copiez ce lien dans votre navigateur : <br>${verificationLink}</p>
            </body>
            </html>
          `,
        }
        await nodemailerTransport.sendMail((emailData));
        console.log('Email sent');

        res.status(201).json({ message: 'Forwarder registered successfully'});
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
  }
};


export const registerAdmin = async (req, res) => {
  try{
      const { email, fullname, password, phoneNumber, gender, roleLevel} = req.body;
      
     
      

     if(!email || !password || !fullname || !phoneNumber || !gender || !roleLevel){
          console.log('All fields are required');
          return res.status(400).json({ message: 'All fields are required' });
      }

      const existingAdmin = await Admin.findOne({ email });

      if(existingAdmin){
          return res.status(400).json({ message: 'Email already in use' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const token = crypto.randomBytes(32).toString("hex");

     

      

      const newAdmin = await Admin.create({
        email,
        password: hashedPassword,
        fullname,
        phoneNumber,
        gender,
        roleLevel,
        role:'admin',
        verificationToken: token,
        verificationTokenExpires: Date.now() + 3600000
      });


      const verificationLink = `${process.env.FRONTEND_URL}/verification?token=${token}`;

      const emailData = {
          from: process.env.EMAIL_FROM,
          to: newAdmin.email,
          subject: "Vérification de votre compte",
          html:`
          <!DOCTYPE html>
          <html>
          <body>
            <p>Merci de vous être inscrit sur <strong>Fret Facile</strong> !</p>
            <p>Pour compléter votre inscription, cliquez sur le lien ci-dessous :</p>
            <a href="${verificationLink}" style="color: #007BFF; font-size: 18px;">Vérifier mon email</a>
            <p>Ou copiez ce lien dans votre navigateur : <br>${verificationLink}</p>
          </body>
          </html>
        `,
      }
      await nodemailerTransport.sendMail((emailData));
      console.log('Email sent');

      res.status(201).json({ message: 'Admin registered successfully'});
  }catch(error){
      console.log(error);
      res.status(400).json({ error: error.message });
}
};


export const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  res.status(200).json({ message: "Déconnexion réussie" });
};


export const login = async (req, res) => {
    try{
        const {email,password} = req.body;
        if(!email || !password){
          console.log(req.body);
            return res.status(400).json({error: 'All fields are required'});
            
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({error: 'User not found'});
        }

        if(user.status != 'ACTIVE'){
          console.log(user.status, 'user status');
          return res.status(400).json({error: 'User is not active'});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({error: 'Invalid credentials'});
        }

        const userData = {
            id: user._id,
            email: user.email,
            fullname: user.fullname,
            role: user.role
        }

        const token = jwt.sign(userData, process.env.JWT_SECRET,{expiresIn: '1d', algorithm: 'HS256'});

        // res.cookie('token', token,{
        //   httpOnly:true,
        //   secure: true,
        //   sameSite: 'none',
        //   maxAge: 24 * 60 * 60 * 1000, // 1 day
        // });

        console.log('User successfully logged in');
        res.status(200).json({message: 'Login successful', token});

    }catch(error){
        console.log(error);
        res.status(400).json({message: 'Login failed'});
    }
}


export const checkStatus = async (req, res) => {
  try {
    // Vérifie simplement si le cookie de session existe et est valide
    if (req.user) {
      return res.status(200).json({
        authenticated: true
      });
    }
    
    return res.status(200).json({
      authenticated: false
    });
  } catch (error) {
    return res.status(500).json({
      authenticated: false,
      error: 'Internal server error'
    });
  }
}





export const verificationToken = async (req,res) => {

    const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token de vérification manquant." });
  }

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }, // Le token doit être valide
    });

    console.log(user);

    if(user.status == 'ACTIVE' || user.status == 'BANNED') {
      return res.status(400).json({ message: "Email déjà vérifié." });
    }

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }

    user.status = 'ACTIVE';
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.status(200).json({ message: "Email vérifié avec succès !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur interne.", error });
  }
}


export const resetPassword = async (req,res) => {
  const { email } = req.body;

  if(!email){
    return res.status(400).json({ message: "Email manquant." });
  }

  try{
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({ message: "Email inexistant." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <!DOCTYPE html>
        <html>
        <body>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour continuer :</p>
          <a href="${resetLink}" style="color: #007BFF; font-size: 18px;">Réinitialiser mon mot de passe</a>
          <p>Ou copiez ce lien dans votre navigateur : <br>${resetLink}</p>
        </body>
        </html>
      `,
    };

    await nodemailerTransport.sendMail(emailData);
    res.status(200).json({ message: "Email envoyé avec succès." });
  }catch(error){
    console.error(error);
    res.status(500).json({ message: "Erreur interne." });
  }
}


export const verifyTokenPassword = async (req,res) => {
  const { token } = req.body;
  const { newPassword } = req.body;

  if(!token || !newPassword){
    return res.status(400).json({ message: "Token ou mot de passe manquant." });
  }

  try{
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpires: { $gt: Date.now() },
    });

    if(!user){
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;

    await user.save();
    res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });

  }catch(error){
    console.error(error);
    res.status(500).json({ message: "Erreur interne." });
  }

}

    
export const updateInfo = async (req, res) => {
  try {
    const { id } = req.user; // ID de l'utilisateur connecté
    const { fullname, phoneNumber, workSituation } = req.body;

    // Assurez-vous que les données requises sont fournies
    if (!fullname || !phoneNumber) {
      return res.status(400).json({ message: "Les champs 'fullname' et 'phoneNumber' sont obligatoires." });
    }

    // Vérifiez que workSituation est valide uniquement pour les utilisateurs "Client"
    const validWorkSituations = ['Entrepreneur', 'Salarié', 'All'];
    if (workSituation && !validWorkSituations.includes(workSituation)) {
      return res.status(400).json({ message: "Valeur de 'workSituation' invalide." });
    }

    // Recherchez l'utilisateur dans la base de données
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }
    // Gérez les utilisateurs en fonction de leur type (discriminant)
    if (user.role === 'client') {
      // Si l'utilisateur est un client, utilisez ClientUser
      console.log('role',user.role);
      const clientUser = await ClientUser.findById(id);

      if (!clientUser) {
        return res.status(404).json({ message: "Utilisateur client introuvable." });
      }

      console.log('client',clientUser);

      // Mettez à jour les informations spécifiques au client
      clientUser.fullname = fullname;
      clientUser.phoneNumber = phoneNumber;
      if (workSituation) {
        clientUser.workSituation = workSituation;
      }

      console.log(user.role);

      // Sauvegardez les modifications
      await clientUser.save();
    } else {
      // Pour les autres types d'utilisateur (Forwarder, Admin)
      user.fullname = fullname;
      user.phoneNumber = phoneNumber;

      // Sauvegardez les modifications
      await user.save();
    }

    // Réponse de succès
    res.status(200).json({ message: "Informations mises à jour avec succès." });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations :', error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


export const signUpWithLink = async (req,res) => {
  try{
    const { email,role } = req.body;
    console.log(email,role);
    const temporaryPassword = generateVerificationCode();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const fullname = email.split('@')[0];

    if(await User.findOne({ email })) {
      return res.status(400).json({ message: 'L\'utilisateur existe déjà' });
    }
    const user = new Forwarder({
      email,
      fullname,
      password:hashedPassword,
      role,
      phoneNumber: 'waiting',
      gender: 'MALE',
      companyName: 'waiting',
      address: 'waiting',
      country: 'waiting',
      document:'waiting',
      status: 'INACTIVE',
    });

    await user.save();

    const currentUser = await User.findOne({ email });

    if(!currentUser){
      return res.status(404).json({ message: 'Une erreur est survenue lors de la création de l\'utilisateur' });
    }

    console.log(process.env.FRONTEND_URL+'/auth/update-new-user/'+currentUser._id);
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Création de compte',
      html: `
        <p>Bonjour,</p>
        <p>Vous avez été invité à créer un compte sur notre application ACHETEZ EN CHINE. Voici vos informations de connexion :</p>
        <p>Email: ${email}</p>
        <p>Voici votre lien pour configurer votre compte : <a href= "${process.env.FRONTEND_URL}/auth/update-new-user/${currentUser._id}">Lien de configuration</a></p>
        <p>Cordialement,</p>
        <p>L\'équipe de ACHETEZ EN CHINE</p>
      `
    };
    await nodemailerTransport.sendMail(emailData);

    res.status(201).json({ message: 'Demande de creation de compte envoyée avec succès' });
    
  }catch(error){
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' , error: error.message });
  }
}


export const updateUserWithLink = async (req,res) => {
  try{

    const { id } = req.params;

    if(!id){
      return res.status(400).json({ message: 'ID utilisateur manquant' });
    }

    const findUser = await User.findById(id);

    if(!findUser){
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    const { fullname,password, phoneNumber, gender,companyName, address, country} = req.body;

      if(!fullname || !password || !phoneNumber || !gender || !companyName || !address || !country){
        return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
      }

      if(!req.file){
        return res.status(400).json({ message: 'Veuillez télécharger un document' });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'raw', 
        folder: 'forwarders/documents', // dossier "virtuel" dans Cloudinary (optionnel)
        public_id: `doc_${Date.now()}`    // nom du fichier souhaité (optionnel)
      });

      const documentUrl = result.secure_url;
      const hashedPassword = await bcrypt.hash(password, 10);


      await Forwarder.findOneAndUpdate({_id: findUser._id},{
        fullname,
        password:hashedPassword,
        phoneNumber,
        gender,
        companyName,
        address,
        country,
        documentUrl,
        status: 'ACTIVE',
      });

      res.status(201).json({ message: 'Utilisateur créé avec succès' });

    
}catch(err){
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' , error: err.message });
  }

}


