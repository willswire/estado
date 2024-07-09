# Estado

Estado is a project designed to manage Terraform State using the HTTP backend on Cloudflare Workers. It leverages Cloudflare’s serverless platform to provide a scalable, reliable, and efficient solution for handling Terraform State, complete with support for state locking. By utilizing Cloudflare Workers, Estado ensures high availability and low latency for state management, making it an excellent choice for teams looking to efficiently manage their Terraform infrastructure state with minimal operational overhead.

## Features

- **Scalable and Reliable**: Built on Cloudflare Workers, Estado offers a highly scalable and reliable environment for managing Terraform State.
- **State Locking**: Prevent concurrent state modifications with built-in support for state locking.
- **Low Latency**: Leverage Cloudflare’s global network to ensure low latency state management.
- **Serverless**: Reduce operational overhead with a serverless architecture that handles scaling and infrastructure management for you.

## Getting Started

### Prerequisites

- A Cloudflare account
- Terraform (or OpenTofu) installed on your local machine
- Node.js installed on your local machine

### Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/willswire/estado.git
   cd estado
   ```

2. **Install Dependencies**

   ```sh
   npm install
   ```

3. **Configure Cloudflare Workers**

   Set up your Cloudflare Workers environment by updating the `wrangler.toml` file in the project root and configure it with your Cloudflare account details.

   ```toml
    name = "estado"
    main = "src/index.ts"
    compatibility_date = "2024-07-01"
    compatibility_flags = [ "nodejs_compat" ]

    [[durable_objects.bindings]]
    name = "TF_STATE_LOCK"
    class_name = "DurableState"

    [[migrations]]
    tag = "v1"
    new_classes = ["DurableState"]

    [[r2_buckets]]
    binding = "TF_STATE_BUCKET"
    bucket_name = "estado"
   ```

4. **Deploy to Cloudflare Workers**

   ```sh
   npx wrangler publish
   ```

## Example Configuration

In your Terraform configuration, you can configure the HTTP backend to use Estado:

```hcl
terraform {
  backend "http" {
    address         = "https://your-worker-url/states/myproject"
    lock_address    = "https://your-worker-url/states/myproject/lock"
    unlock_address  = "https://your-worker-url/states/myproject/lock"
  }
}
```

Replace `https://your-worker-url` with the URL of your deployed Cloudflare Worker.

## Contributing

If you have suggestions, bug reports, or feature requests, please open an issue or submit a pull request on GitHub.
