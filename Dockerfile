FROM node:20-alpine
WORKDIR /math_problem_v2
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
EXPOSE 5000
CMD ["node", "index.js"]