FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your app uses (change if needed)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]