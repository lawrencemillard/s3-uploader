# S3 Uploader

S3 Uploader is a Fastify-based web application that allows users to upload files to an S3-compatible storage service. This application includes rate limiting and IP blacklisting functionalities to enhance security.

## Features

- File uploads to S3-compatible storage
- Rate limiting to prevent abuse
- IP blacklisting for rate limit violators
- API key management for upload access control
- SQLite database for tracking uploads and blacklist entries
- Static file serving

## Setup Instructions

This README will assume you are using pnpm as that is my personal choice, but you can use any alternative you desire.

### Prerequisites

- Node.js (v14 or higher)
- pnpm/npm
- SQLite

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/keirim/s3-uploader.git
   cd s3-uploader
   ```

2. Install the dependencies:
   ```sh
   pnpm i
   ```

3. Create a `.env` file based on the provided `.env.example`:
   ```sh
   cp .env.example .env
   ```

4. Fill in the environment variables in the `.env` file:
   ```dotenv
   AWS_REGION=your-aws-region
   S3_ENDPOINT=your-s3-endpoint
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   BUCKET_NAME=your-bucket-name
   ```

### Running the Application

1. Start the application:
   ```sh
   pnpm start
   ```

2. The server will be running on `http://localhost:6969`.

### Available Scripts

- `start`: Start the application
- `dev`: Start the application with nodemon (for development)
- `stats:total-uploads`: Get the total number of uploads
- `stats:unique-users`: Get the number of unique users
- `stats:blacklisted-users`: Get the number of blacklisted users
- `api-keys:create`: Create a new API key
- `api-keys:list`: List all API keys
- `api-keys:update`: Update an API key by ID
- `api-keys:delete`: Delete an API key by ID

### API Key Management

API keys are required to upload files. The following scripts can be used to manage API keys:

- `api-keys:create`: Generates a new API key and stores it in the SQLite database.
- `api-keys:list`: Lists all API keys stored in the database.
- `api-keys:update <id>`: Updates an API key by its ID.
- `api-keys:delete <id>`: Deletes an API key by its ID.

## Environment Variables

The following environment variables are required for the application to run:

- `AWS_REGION`: Your AWS region
- `S3_ENDPOINT`: Your S3-compatible storage endpoint
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `BUCKET_NAME`: The name of your S3 bucket

## License

This project is licensed under the GPL License.

## Author

This project was originally created and is maintained, at the time of writing, by [Keiran](https://slop.sh)
