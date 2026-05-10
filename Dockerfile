FROM node:20-alpine
WORKDIR /math_learning_app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
EXPOSE 3001
CMD ["node", "index.js"]