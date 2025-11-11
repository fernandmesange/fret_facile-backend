import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/Auth.routes.js';
import requestRoutes from './routes/Request.routes.js';
import transactionRoutes from './routes/Transaction.routes.js';
import quoteRoutes from './routes/Quote.routes.js';
import statsRoutes from './routes/Stats.routes.js';
import orderRoutes from './routes/Order.routes.js';
import notificationRoutes from './routes/Notification.routes.js';
import path from 'path';
import url from 'url';
import { connectDB } from './db/connectDB.js';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import articleRoutes from './routes/Article.routes.js';


dotenv.config();

const app = express();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

app.use(cors({
  origin: ['http://localhost:5173', 'https://transitchina.xyz', 'http://localhost:5174', 'https://www.transitchina.xyz'],
  credentials: true,
}));

app.options('', cors());


// app.use(compression({
//   level: 6,
//   threshold: 1024,
//   filter: (req, res) => {
//     // Appliquer Gzip uniquement si le contenu peut être compressé
//     if (req.headers["x-no-compression"]) {
//       return false; // Ne pas compresser si cet en-tête est défini
//     }
//     return compression.filter(req, res);
//   },
// }));


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.get('/', (req,res) => {
  res.send('<h1>Hello World !!! </h1>')
});

app.use('/api/v1/auth',authRoutes);
app.use('/api/v1/quote',quoteRoutes);
app.use('/api/v1/request',requestRoutes);
app.use('/api/v1/transaction',transactionRoutes);
app.use('/api/v1/stats',statsRoutes);
app.use('/api/v1/order',orderRoutes);
app.use('/api/v1/notification',notificationRoutes);
app.use('/api/v1/article',articleRoutes);

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, '/views', 'success.html'));
});

// Route pour la redirection après échec
app.get('/failure', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'failure.html'));
});




//Mettre 5000 pour le deploiement et 5001 pour le dev
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server Running on port '+PORT )
  connectDB();});

