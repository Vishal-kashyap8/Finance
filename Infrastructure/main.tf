terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# Create Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Create App Service Plan (Linux, Free/Basic Tier)
resource "azurerm_service_plan" "app_service_plan" {
  name                = var.app_service_plan_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = var.sku_name

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Create App Service
resource "azurerm_linux_web_app" "app_service" {
  name                = var.app_service_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.app_service_plan.id

  site_config {
    minimum_tls_version = "1.2"
    always_on           = false  # Free tier doesn't support always_on
    
    # Application stack (Node.js example - adjust as needed)
    application_stack {
      node_version = "20-lts"
    }
  }

  https_only = true

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
