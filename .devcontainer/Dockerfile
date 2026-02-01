# Use a Node.js base image
FROM node:24-alpine

# Set the working directory
WORKDIR /workspace

# Install pnpm globally
RUN npm install -g pnpm

# Expose the port Vite will run on
EXPOSE 5173

# Default command to start the Vite dev server
CMD ["pnpm", "start", "--host", "0.0.0.0"]