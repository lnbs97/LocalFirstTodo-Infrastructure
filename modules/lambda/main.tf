module "lambda_function" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "todo-crud"
  handler       = "todo-crud.handler"
  runtime       = "nodejs22.x"
  publish       = true

  source_path = "./modules/lambda/src/todo-crud"

  allowed_triggers = {
    APIGatewayAny = {
      service    = "apigateway"
      source_arn = "${var.api_execution_arn}/*/*"
    }
  }

  # TODO: replace with role, see https://github.com/terraform-aws-modules/terraform-aws-lambda/blob/master/examples/complete/main.tf
  # or like this https://github.com/terraform-aws-modules/terraform-aws-apigateway-v2/blob/master/examples/websocket/main.tf
  # attach_policy_statements = true
  # policy_statements = {
  #   dynamodb = local.dynamodb_crud_permissions
  # }
  attach_policy_json = true
  policy_json        = <<-EOT
{
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem"
        ],
        "Resource" : "arn:aws:dynamodb:eu-central-1:${var.aws_account_id}:table/todos"
      }
    ]
  }
EOT
}

module "lambda_authorizer" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "authorizer"
  handler       = "authorizer.handler"
  runtime       = "nodejs22.x"
  publish       = true

  source_path = "./modules/lambda/src/authorizer"

  allowed_triggers = {
    APIGatewayAny = {
      service    = "apigateway"
      source_arn = "${var.api_execution_arn}/*/*"
    }
  }
}