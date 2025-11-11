FROM node:18.20.5

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm","start"]