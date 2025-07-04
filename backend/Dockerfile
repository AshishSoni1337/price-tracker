FROM node:18-slim

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npx playwright install --with-deps

COPY . .

EXPOSE 3000

CMD ["node", "--inspect=0.0.0.0:9229", "src/index.js"]
