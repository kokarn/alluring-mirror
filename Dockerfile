FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache tzdata

ENV TZ Europe/Stockholm

RUN npm ci --only=production

COPY . .

EXPOSE 4000

CMD [ "npm", "start" ]
