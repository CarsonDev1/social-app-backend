# Giai đoạn build
FROM node:16-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Giai đoạn production
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Cài đặt biến môi trường
ENV NODE_ENV=production
ENV PORT=8080

# Mở cổng 8080 (Cloud Run sẽ định cấu hình cổng này)
EXPOSE 8080

CMD ["node", "dist/main"]