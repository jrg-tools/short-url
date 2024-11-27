terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  profile = "default"

  default_tags {
    tags = {
      app = var.name
    }
  }
}
