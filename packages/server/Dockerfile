FROM node:10.13.0

RUN npm config set strict-ssl false
RUN npm i -g yarn

WORKDIR /home/app

COPY package.json .
COPY yarn.lock .

RUN yarn config set strict-ssl false
RUN yarn config set enableStrictSsl false
RUN yarn

COPY . .

EXPOSE 8000

CMD yarn start
