FROM node:18-slim

WORKDIR /usr/src/app
COPY package.json .
COPY yarn.lock .

RUN yarn config set strict-ssl false
RUN yarn config set enableStrictSsl false
RUN yarn
COPY . .

CMD yarn start
