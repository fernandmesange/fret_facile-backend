
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body } from "express-validator";
import cloudinary from './../middlewares/cloudinary.js';
import { Requests } from '../models/Request.model.js';
import crypto from 'crypto';
import { Orders } from '../models/Order.model.js';
import nodemailerTransport from "../config/nodeMailerTransport.js";
import { Notification } from "../models/Notification.model.js";
import { User , Forwarder, Admin} from '../models/Users.model.js';
import { Articles } from '../models/article.model.js';
import slugify from 'slugify';


dotenv.config();

export const getPublicArticles = async (req, res) => {
    try{
        const articles = await Articles.find({status:'PUBLISHED'});
        res.status(200).json(articles);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

export const getAllArticles = async (req, res) => {
  try{
      const articles = await Articles.find();
      res.status(200).json(articles);
  }catch(error){
      console.log(error);
      res.status(400).json({ error: error.message });
  }
}

export const getArticle = async (req, res) => {
    try{
        const { slug } = req.params;
        const article = await Articles.findOne({slug});

        if(!article){
            return res.status(404).json({ error: "Article not found" });
        }
        res.status(200).json(article);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

export const publishArticle = async (req, res) => {
    try{
        const { id } = req.user;
        const { title, description, category, content } = req.body;

        if(!title || !description || !category || !content){
            return res.status(400).json({ error: "All fields are required" });
        }

        const slug = slugify(title, { lower: true , strict: true });

        const mainImage = req.files.mainImage[0];
        const secondaryImage = req.files.secondaryImage[0];


        const user = await User.findById(id);
        if(!user){
            return res.status(400).json({ error: "User not found" });
        }

        const mainImages = await cloudinary.uploader.upload(mainImage.path, {
          folder: 'articles',
        });

        const secondaryImages = await cloudinary.uploader.upload(secondaryImage.path, {
          folder: 'articles',
        });

        const mainImageUrl = mainImages.secure_url;
        const secondaryImageUrl = secondaryImages.secure_url;

        const article = new Articles({
            title,
            description,
            content: JSON.parse(content),
            categories: category,
            mainImage: mainImageUrl,
            secondaryImages: secondaryImageUrl,
            author: user._id,
            slug,
            status: 'PUBLISHED'
        });

        await article.save();
        res.status(200).json(article);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


