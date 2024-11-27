resource "aws_api_gateway_rest_api" "x" {
  name        = var.name
  description = "Short URL API"
}

resource "aws_api_gateway_stage" "x" {
  deployment_id = aws_api_gateway_deployment.x.id
  rest_api_id   = aws_api_gateway_rest_api.x.id
  stage_name    = "g"
}

resource "aws_api_gateway_deployment" "x" {
  rest_api_id = aws_api_gateway_rest_api.x.id

  depends_on = [
    aws_api_gateway_integration.root_integration,
    aws_api_gateway_integration.item_get_integration,
    aws_api_gateway_integration.item_delete_integration,
    aws_api_gateway_integration.search_integration,
  ]

  triggers = {
    redeployment = sha256(jsonencode([
      aws_api_gateway_rest_api.x.id,
      aws_api_gateway_resource.item.id,
      aws_api_gateway_resource.search.id,
      aws_api_gateway_method.root_post.id,
      aws_api_gateway_method.item_get.id,
      aws_api_gateway_method.item_delete.id,
      aws_api_gateway_method.search_get.id,
      aws_lambda_permission.apigw.id
    ]))
  }
}

resource "aws_api_gateway_integration" "root_integration" {
  rest_api_id = aws_api_gateway_rest_api.x.id
  resource_id = aws_api_gateway_rest_api.x.root_resource_id
  http_method = aws_api_gateway_method.root_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.x_short_url.invoke_arn
}

resource "aws_api_gateway_integration" "item_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.x.id
  resource_id = aws_api_gateway_resource.item.id
  http_method = aws_api_gateway_method.item_get.http_method

  integration_http_method = "POST" # lambda only accepts POST (internal method)
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.x_short_url.invoke_arn
}

resource "aws_api_gateway_integration" "item_delete_integration" {
  rest_api_id = aws_api_gateway_rest_api.x.id
  resource_id = aws_api_gateway_resource.item.id
  http_method = aws_api_gateway_method.item_delete.http_method

  integration_http_method = "POST" # lambda only accepts POST (internal method)
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.x_short_url.invoke_arn
}

resource "aws_api_gateway_integration" "search_integration" {
  rest_api_id = aws_api_gateway_rest_api.x.id
  resource_id = aws_api_gateway_resource.search.id
  http_method = aws_api_gateway_method.search_get.http_method

  integration_http_method = "POST" # lambda only accepts POST (internal method)
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.x_short_url.invoke_arn
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.x_short_url.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.x.execution_arn}/*/*/*"
}
