# imports the globals
data "external" "globals" {
  program     = ["env", "APP_ENV=${terraform.workspace}", "NODE_ENV=${var.node_env}", "npx", "whook", "terraformValues", "--type='globals'"]
  working_dir = ".."
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
  description              = "An Whook API on the AWS Lambda platform"
  minimum_compression_size = 1024
  binary_media_types = [
    "image/png",
    "image/*",
    "image/apng",
    "image/webp",
    "application/pdf"
  ]
  body = data.template_file.template_file.rendered
  endpoint_configuration {
    types = ["REGIONAL"]
  }
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

# You may want to add a custom domain that way
# resource "aws_api_gateway_domain_name" "api_gateway_domain_name" {
#   domain_name              = data.external.globals.result["domain"]
#   regional_certificate_arn = aws_acm_certificate.acm_certificate.arn
#   endpoint_configuration {
#     types = ["REGIONAL"]
#   }
#   security_policy = "TLS_1_0"
# }

# resource "aws_api_gateway_base_path_mapping" "api_gateway_base_path_mapping" {
#   api_id      = aws_api_gateway_rest_api.api_gateway_rest_api.id
#   stage_name  = aws_api_gateway_stage.api_gateway_stage.stage_name
#   domain_name = aws_api_gateway_domain_name.api_gateway_domain_name.domain_name
#   base_path   = ""
# }
