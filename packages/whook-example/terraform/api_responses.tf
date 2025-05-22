# The purpose of this file is to make all AWS
# errors look like the Whook's ones

resource "aws_api_gateway_gateway_response" "access_denied" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "403"
  response_type = "ACCESS_DENIED"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "access_denied",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_ACCESS_DENIED",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "api_configuration_error" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "500"
  response_type = "API_CONFIGURATION_ERROR"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "server_error",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_API_CONFIGURATION_ERROR",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "authorizer_configuration_error" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "500"
  response_type = "AUTHORIZER_CONFIGURATION_ERROR"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "server_error",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_AUTHORIZER_CONFIGURATION_ERROR",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "authorizer_failure" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "500"
  response_type = "AUTHORIZER_FAILURE"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "server_error",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_AUTHORIZER_FAILURE",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "bad_request_parameters" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "400"
  response_type = "BAD_REQUEST_PARAMETERS"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "bad_request",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_BAD_REQUEST_PARAMETERS",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "bad_request_body" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "400"
  response_type = "BAD_REQUEST_BODY"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "bad_request",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_BAD_REQUEST_BODY",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "expired_token" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "403"
  response_type = "EXPIRED_TOKEN"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "access_denied",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_EXPIRED_TOKEN",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "integration_failure" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "504"
  response_type = "INTEGRATION_FAILURE"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "server_error",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_INTEGRATION_FAILURE",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "integration_timeout" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "504"
  response_type = "INTEGRATION_TIMEOUT"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "server_error",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_INTEGRATION_TIMEOUT",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "invalid_api_key" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "403"
  response_type = "INVALID_API_KEY"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "access_denied",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_INVALID_API_KEY",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "invalid_signature" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "403"
  response_type = "INVALID_SIGNATURE"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "access_denied",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_INVALID_SIGNATURE",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "missing_authentication_token" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "403"
  response_type = "MISSING_AUTHENTICATION_TOKEN"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "access_denied",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_MISSING_AUTHENTICATION_TOKEN",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "quota_exceeded" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "429"
  response_type = "QUOTA_EXCEEDED"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "access_denied",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_QUOTA_EXCEEDED",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "request_too_large" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "413"
  response_type = "REQUEST_TOO_LARGE"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "bad_request",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_REQUEST_TOO_LARGE",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "resource_not_found" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "404"
  response_type = "RESOURCE_NOT_FOUND"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "bad_request",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_RESOURCE_NOT_FOUND",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "throttled" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "429"
  response_type = "THROTTLED"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "access_denied",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_THROTTLED",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "unauthorized" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "401"
  response_type = "UNAUTHORIZED"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "access_denied",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_UNAUTHORIZED",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
resource "aws_api_gateway_gateway_response" "unsupported_media_type" {
  rest_api_id   = aws_api_gateway_rest_api.api_gateway_rest_api.id
  status_code   = "415"
  response_type = "UNSUPPORTED_MEDIA_TYPE"
  response_templates = {
    "application/json" = <<EOT
{
  "error": "bad_request",
  "error_description": $context.error.messageString%{if terraform.workspace != "production"},
  "error_debug_data": {
    "code": "E_UNSUPPORTED_MEDIA_TYPE",
  }%{else}%{endif}
}
EOT
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'",
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent,X-Transaction-Id,X-API-Version,X-SDK-Version,X-APP-Version'",
    "gatewayresponse.header.Vary"                         = "'Origin'"
  }
}
