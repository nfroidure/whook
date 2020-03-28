# imports the globals
data "external" "globals" {
  program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='globals'"]
}

resource "aws_internet_gateway" "api_gateway" {
  tags = {
    Name = "Whook API ${terraform.workspace}"
  }
}

data "template_file" "template_file" {
  template = data.external.globals.result["openapi"]

  vars = zipmap(
    keys(data.external.api_lambdas.result),
    [for key in keys(data.external.api_lambdas.result) : aws_lambda_function.lambda_function[key].invoke_arn]
  )
}


resource "aws_api_gateway_rest_api" "api_gateway_rest_api" {
  name                     = "Whook API (${terraform.workspace})"
  description              = "Whook API"
  minimum_compression_size = 1024
  binary_media_types = [
    "image/png",
    "image/*",
    "image/apng",
    "image/webp",
    "application/pdf"
  ]
  body       = data.template_file.template_file.rendered
  depends_on = [aws_lambda_function.lambda_function]
}

resource "aws_api_gateway_deployment" "api_gateway_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
  # This has to be left empty to let api_gateway_stage
  #  manage the stage options
  stage_name        = ""
  stage_description = "Deployment checksums ${data.external.globals.result["openapiHash"]}-${data.external.globals.result["commitHash"]}"
  description       = data.external.globals.result["commitMessage"]
  depends_on        = [aws_api_gateway_rest_api.api_gateway_rest_api]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "api_gateway_stage" {
  stage_name            = terraform.workspace
  rest_api_id           = aws_api_gateway_rest_api.api_gateway_rest_api.id
  deployment_id         = aws_api_gateway_deployment.api_gateway_deployment.id
  cache_cluster_enabled = true
  cache_cluster_size    = 0.5
  xray_tracing_enabled  = true
}

# resource "aws_api_gateway_method_settings" "api_gateway_method_settings" {
#   rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
#   stage_name  = aws_api_gateway_stage.api_gateway_stage.stage_name
#   method_path = "*/*"
#   settings {
#     metrics_enabled        = true
#     logging_level          = "INFO"
#     data_trace_enabled     = true
#     caching_enabled        = false
#     cache_ttl_in_seconds   = 300
#     throttling_burst_limit = 5000
#     throttling_rate_limit  = 10000
#   }
# }
