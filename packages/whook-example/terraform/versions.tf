
terraform {
  required_version = ">= 0.13"
  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.1"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.30"
    }
    template = {
      source  = "hashicorp/template"
      version = "~> 2.2.0"
    }
  }
}

provider "aws" {
  region = "eu-west-3"
}

provider "archive" {
}

provider "template" {
}
