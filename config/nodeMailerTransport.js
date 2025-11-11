import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const nodemailerTransport = nodemailer.createTransport({
    host:"smtp.hostinger.com",
    port: 465,
    secure: true,
    secureConnection: false,
    tls:{
      ciphers: 'SSLv3',
    },
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

export default nodemailerTransport;