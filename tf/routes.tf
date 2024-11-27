# /
resource "aws_api_gateway_method" "root_post" {
  rest_api_id   = aws_api_gateway_rest_api.x.id
  resource_id   = aws_api_gateway_rest_api.x.root_resource_id
  http_method   = "POST"
  authorization = "NONE"
}

# /{x}
resource "aws_api_gateway_resource" "item" {
  rest_api_id = aws_api_gateway_rest_api.x.id
  parent_id   = aws_api_gateway_rest_api.x.root_resource_id
  path_part   = "{x}"
}

resource "aws_api_gateway_method" "item_get" {
  rest_api_id   = aws_api_gateway_rest_api.x.id
  resource_id   = aws_api_gateway_resource.item.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "item_delete" {
  rest_api_id   = aws_api_gateway_rest_api.x.id
  resource_id   = aws_api_gateway_resource.item.id
  http_method   = "DELETE"
  authorization = "NONE"
}

# /search
resource "aws_api_gateway_resource" "search" {
  rest_api_id = aws_api_gateway_rest_api.x.id
  parent_id   = aws_api_gateway_rest_api.x.root_resource_id
  path_part   = "search"
}

resource "aws_api_gateway_method" "search_get" {
  rest_api_id   = aws_api_gateway_rest_api.x.id
  resource_id   = aws_api_gateway_resource.search.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters = {
    "method.request.querystring.query" = true
  }
}
