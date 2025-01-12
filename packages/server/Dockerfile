FROM node:18-alpine

RUN npm config set strict-ssl false

WORKDIR /home/app

COPY package.json .
COPY yarn.lock .

RUN yarn config set strict-ssl false
RUN yarn config set enableStrictSsl false
RUN yarn

COPY . .

EXPOSE 8000

CMD yarn start
