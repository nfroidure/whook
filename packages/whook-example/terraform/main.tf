# imports the lambda list
data "external" "lambdas" {
  program     = ["env", "APP_ENV=${terraform.workspace}", "NODE_ENV=${var.node_env}", "npx", "whook", "terraformValues", "--type='lambdas'"]
  working_dir = ".."
}
