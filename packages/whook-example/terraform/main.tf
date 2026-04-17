provider "google" {
  version     = "~> 3.14"
  project     = var.project_id
  region      = var.region
  zone        = var.zone
  credentials = file(".credentials.json")
}

provider "archive" {
  version = "~> 1.3"
}

provider "template" {
  version = "~> 2.1.2"
}

output "api_url" {
  value = google_endpoints_service.endpoints_service.dns_address
}

data "google_project" "project" {
  project_id = var.project_id
}

# imports the functions list
data "external" "functions" {
  program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='functions'", "--functionType='http'"]
}
data "external" "globals" {
  program = ["env", "NODE_ENV=${terraform.workspace}", "npx", "whook", "terraformValues", "--type='globals'"]
}

data "template_file" "template_file" {
  template = data.external.globals.result["openapi2"]

  vars = merge({
    "infos_host" : "${var.api_name}.endpoints.${data.google_project.project.project_id}.cloud.goog"
    }, zipmap(
    [for key in keys(data.external.functions.result) : "function_${key}"],
    [for key in keys(data.external.functions.result) : google_cloudfunctions_function.cloudfunctions_function[key].https_trigger_url]
  ))
}

resource "google_endpoints_service" "endpoints_service" {
  service_name   = "${var.api_name}.endpoints.${data.google_project.project.project_id}.cloud.goog"
  project        = data.google_project.project.project_id
  openapi_config = data.template_file.template_file.rendered
}
