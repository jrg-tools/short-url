terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.78.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.6.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.3"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.47.0"
    }
  }

  backend "s3" {
    bucket  = "terraform-backend-jrg-tools"
    key     = "tools/terraform.tfstate"
    encrypt = true
    region  = "ap-southeast-1" # singapore
  }
}
