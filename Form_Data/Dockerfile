# Step 1: Use a modern Node image
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy all project files and build React app
COPY . .
RUN npm run build

# Step 2: Use Nginx to serve static files
FROM nginx:alpine

# Copy the build output to Nginx HTML folder
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
