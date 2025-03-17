# Stage 1: Build
# Utilizing Node.js v16.20.2 on Alpine for the build environment
FROM public.ecr.aws/docker/library/node:16.12.0-alpine3.13 as builder

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if available) to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application's source code from your host to your image filesystem.
COPY . .

COPY .env .env

RUN npm run build
# Expose the port the app runs on
EXPOSE 4002

# Command to run the application
CMD ["node", "dist/rummy.js"]
