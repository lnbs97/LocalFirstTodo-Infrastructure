module "dynamodb_table" {
  source   = "terraform-aws-modules/dynamodb-table/aws"

  name     = "todos"
  hash_key = "user_id"
  range_key = "id"

  attributes = [
    {
      name = "user_id"
      type = "S"
    },
    {
      name = "id"
      type = "S"
    }
  ]
}