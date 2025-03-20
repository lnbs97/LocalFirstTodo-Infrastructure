module "api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"

  name          = "mobile_app_gateway"
  description   = "My awesome HTTP API Gateway"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_headers = [
      "content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token",
      "x-amz-user-agent"
    ]
    allow_methods = ["*"]
    allow_origins = ["*"]
  }

  # Custom domain
  # domain_name = "test"

  # Disable creation of the domain name and API mapping
  create_domain_name = false

  # Disable creation of Route53 alias record(s) for the custom domain
  create_domain_records = false

  # Access logs
  stage_access_log_settings = {
    create_log_group            = true
    log_group_retention_in_days = 7
    format = jsonencode({
      context = {
        domainName              = "$context.domainName"
        integrationErrorMessage = "$context.integrationErrorMessage"
        protocol                = "$context.protocol"
        requestId               = "$context.requestId"
        requestTime             = "$context.requestTime"
        responseLength          = "$context.responseLength"
        routeKey                = "$context.routeKey"
        stage                   = "$context.stage"
        status                  = "$context.status"
        error = {
          message      = "$context.error.message"
          responseType = "$context.error.responseType"
        }
        identity = {
          sourceIP = "$context.identity.sourceIp"
        }
        integration = {
          error             = "$context.integration.error"
          integrationStatus = "$context.integration.integrationStatus"
        }
      }
    })
  }

  # Authorizer(s)
  authorizers = {
    "firebase" = {
      authorizer_type = "JWT"
      identity_sources = ["$request.header.Authorization"]
      name            = "firebase-auth"
      jwt_configuration = {
        audience = [var.firebase_project_id]
        issuer = "https://securetoken.google.com/${var.firebase_project_id}"
      }
    }
  }

  # Routes & Integration(s)
  routes = {
    "PUT /todos/{id}" = {
      authorization_type = "JWT"
      authorizer_key     = "firebase"

      integration = {
        uri                    = var.todo_crud_lambda_arn
        payload_format_version = "2.0"
        timeout_milliseconds   = 12000
      }
    }
    "POST /todos" = {
      authorization_type = "JWT"
      authorizer_key     = "firebase"

      integration = {
        uri                    = var.todo_crud_lambda_arn
        payload_format_version = "2.0"
        timeout_milliseconds   = 12000
      }
    }
    "GET /todos" = {
      authorization_type = "JWT"
      authorizer_key     = "firebase"

      integration = {
        uri                    = var.todo_crud_lambda_arn
        payload_format_version = "2.0"
        timeout_milliseconds   = 12000
      }
    }
    "GET /todos/{id}" = {
      authorization_type = "JWT"
      authorizer_key     = "firebase"

      integration = {
        uri                    = var.todo_crud_lambda_arn
        payload_format_version = "2.0"
        timeout_milliseconds   = 12000
      }
    }
    "DELETE /todos/{id}" = {
      authorization_type = "JWT"
      authorizer_key     = "firebase"

      integration = {
        uri                    = var.todo_crud_lambda_arn
        payload_format_version = "2.0"
        timeout_milliseconds   = 12000
      }
    }
  }
}