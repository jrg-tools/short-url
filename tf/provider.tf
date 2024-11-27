provider "aws" {
  profile = "default"

  default_tags {
    tags = {
      app = var.name
    }
  }
}

provider "aws" {
  profile = "default"
  alias   = "us-east-1"
  region  = "us-east-1"

  default_tags {
    tags = {
      app = var.name
    }
  }
}

provider "cloudflare" {
  # email pulled from $CLOUDFLARE_EMAIL
  # token pulled from $CLOUDFLARE_TOKEN
}
