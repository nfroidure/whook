FROM node:20-alpine AS build-image

WORKDIR /app

# For PG Native build
RUN apk --no-cache add make python3 gcc postgresql-dev g++

COPY package.json package-lock.json* ./

# **IMPORTANT**: Replace this line per
# `npm ci` in your own deployments
# For it to work in the `whook` monorepos,
#  had to remove the c
RUN npm i

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ARG APP_ENV=production
ENV APP_ENV=$APP_ENV

ARG DEV_MODE=0
ENV DEV_MODE=$DEV_MODE

COPY ./src /app/src
COPY ./tsconfig.json /app/tsconfig.json
RUN npm run build
RUN npm ci --production && npm cache clean --force

FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./

COPY --from=build-image /app/node_modules /app/node_modules
COPY --from=build-image /app/dist /app/dist
COPY --from=build-image /app/builds /app/builds

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ARG APP_ENV=production
ENV APP_ENV=$APP_ENV

ARG HOST=0.0.0.0
ENV HOST=$HOST
ARG PORT=8000
ENV PORT=$PORT

ENV MAIN_FILE builds/${APP_ENV}/server/start.js

EXPOSE ${PORT}

CMD node ${MAIN_FILE}
