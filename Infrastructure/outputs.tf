output "resource_group_id" {
  description = "Resource Group ID"
  value       = azurerm_resource_group.rg.id
}

output "app_service_plan_id" {
  description = "App Service Plan ID"
  value       = azurerm_service_plan.app_service_plan.id
}

output "app_service_id" {
  description = "App Service ID"
  value       = azurerm_linux_web_app.app_service.id
}

output "app_service_default_hostname" {
  description = "Default hostname of the App Service"
  value       = azurerm_linux_web_app.app_service.default_hostname
}

output "app_service_url" {
  description = "URL of the App Service"
  value       = "https://${azurerm_linux_web_app.app_service.default_hostname}"
}
