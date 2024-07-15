# 📐 Estado

[![CodeQL](https://github.com/willswire/estado/actions/workflows/codeql.yml/badge.svg)](https://github.com/willswire/estado/actions/workflows/codeql.yml)
[![Code Coverage](https://github.com/willswire/estado/actions/workflows/coverage.yml/badge.svg)](https://github.com/willswire/estado/actions/workflows/coverage.yml)
[![Deploy](https://github.com/willswire/estado/actions/workflows/deploy.yml/badge.svg)](https://github.com/willswire/estado/actions/workflows/deploy.yml)

Estado is a project designed to manage Terraform State using the HTTP backend on Cloudflare Workers. It leverages Cloudflare’s serverless platform to provide a scalable, reliable, and efficient solution for handling Terraform State, complete with support for state locking.

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

   Set up your Cloudflare Workers environment by updating the `wrangler.toml` file in the project root with your Cloudflare account details.

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

## Configuration

In your Terraform configuration, you can configure the HTTP backend to use Estado:

```hcl
terraform {
  backend "http" {
    address         = "https://your-worker-url/myproject"
    lock_address    = "https://your-worker-url/myproject/lock"
    unlock_address  = "https://your-worker-url/myproject/lock"
  }
}
```

Replace `https://your-worker-url` with the URL of your deployed Cloudflare Worker.

## Deployment

By using Cloudflare's Zero Trust framework, you can create a policy for your deployed endpoint that enhances security. Follow these steps to set up Zero Trust for your Estado endpoint:

1. **Log in to Cloudflare Dashboard**

   Visit the Cloudflare dashboard and navigate to the Zero Trust section.

2. **Create an Application**

   Define a new application in the Zero Trust dashboard. Set the application type to web and enter the URL of your Estado endpoint.

3. **Configure Access Policies**

   Create an access policy to control who can access your Estado endpoint. You can define rules based on identity, including allowing specific users, groups, or IP addresses. You can also enforce multi-factor authentication (MFA) for additional security.

4. **Deploy Policies**

   Save and deploy the configured access policies. Cloudflare will now enforce these policies for any requests hitting your Estado endpoint.

By implementing Cloudflare Zero Trust, you ensure that only authorized users can access your remote state endpoint, protecting your Terraform state from unauthorized access and potential threats.

## Contributing

If you have suggestions, bug reports, or feature requests, please open an issue or submit a pull request on GitHub.
