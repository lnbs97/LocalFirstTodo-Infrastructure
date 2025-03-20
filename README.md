# LocalFirstTodo-Infrastructure
This repository contains the Terraform Infrastructure-as-Code (IaC) files for the backend of a Todo app. The related app can be found here:

https://github.com/lnbs97/LocalFirstTodo

## Features
- Provides CRUD endpoints for Todo items
- Supports multiple app users, each user can only access his own todos
- Supports authentication via Firebase and a lambda authorizer function
- Supports multiple environments (dev, prod) each hosted in a separate AWS account
	
## Setup
- Create multiple AWS accounts (suggestion: use AWS organizations)
  - One management account for managing the tfstate
  - One account per environment (dev, prod)
- Create a Firebase project for authentication (manually)
- Supply the dev and prod.tfvars (fill and rename example files)

## Usage
- Use terraform init -backend-config="environments/backend-dev.config" -reconfigure to switch environments
- Use terraform apply -var-file="environments/dev.tfvars" -auto-approve to deploy infrastructure for environment

## ToDo
- Supply custom API domain
- Supply Firebase project via terraform
- Create CI/CD pipeline to automatically run terraform
