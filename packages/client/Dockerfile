FROM node:18-alpine AS builder

WORKDIR /home/app

COPY package.json .
COPY yarn.lock .

RUN yarn config set strict-ssl false
RUN yarn config set enableStrictSsl false
RUN yarn

COPY . .

RUN yarn build

FROM nginx:alpine
COPY --from=0 /home/app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
