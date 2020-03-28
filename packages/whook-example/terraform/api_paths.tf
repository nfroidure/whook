# Sadly this doesn't work since it creates a
#  cyclic dependency despite the fact that it
#  theorically doesn't, so we have to do it
#  for each path level, manually.

# imports the lambda paths
# data "external" "paths" {
#   program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='paths'"]
# }

# resource "aws_api_gateway_resource" "api_gateway_resource" {
#   for_each  = data.external.paths.result
#   path_part = split("|", each.value)[1]
#   parent_id = (each.value == "_root" ?
#     aws_api_gateway_rest_api.api_gateway_rest_api.root_resource_id :
#   aws_api_gateway_resource.api_gateway_resource[split("|", each.value)[0]].id)
#   rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
# }

# Awaiting for an eventual fix, we have to do this ugly
#  fix consisting of creating a resource groupe for each
#  api path levels. You should ad as much blocks as levels
#  in your api here

# Note that the name prefix and the command pathsIndex
#  argument must be incremented manually

# imports the lambda paths at index 0
data "external" "paths0" {
  program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='paths'", "--pathsIndex=0"]
}

resource "aws_api_gateway_resource" "api_gateway_resource0" {
  for_each    = data.external.paths0.result
  path_part   = split("|", each.value)[1]
  parent_id   = aws_api_gateway_rest_api.api_gateway_rest_api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
}

# imports the lambda paths at index 1
data "external" "paths1" {
  program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='paths'", "--pathsIndex=1"]
}

resource "aws_api_gateway_resource" "api_gateway_resource1" {
  for_each    = data.external.paths1.result
  path_part   = split("|", each.value)[1]
  parent_id   = aws_api_gateway_resource.api_gateway_resource0[split("|", each.value)[0]].id
  rest_api_id = aws_api_gateway_rest_api.api_gateway_rest_api.id
}
