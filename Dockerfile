FROM node:14

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

ENV PORT 8080

EXPOSE $PORT

CMD [ "npm", "run", "dev" ]