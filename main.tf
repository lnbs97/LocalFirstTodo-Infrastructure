module "dynamodb" {
  source = "./modules/dynamodb"
}

module "lambda" {
  source = "./modules/lambda"
  api_execution_arn = module.api_gateway.api_execution_arn
  aws_account_id = var.aws_account_id
}

module "api_gateway" {
  source = "./modules/api_gateway"
  todo_crud_lambda_arn = module.lambda.todo_crud_lambda_arn
  firebase_project_id = var.firebase_project_id
}