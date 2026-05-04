FROM node:16-alpine AS builder
ARG API_GATEWAY=http://localhost:3000
ENV API_GATEWAY=$API_GATEWAY
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY vhost.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
