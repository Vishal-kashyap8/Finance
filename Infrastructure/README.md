# Terraform - Azure App Service (Linux)

This Terraform configuration creates an Azure App Service running on Linux with a Free or Basic tier.

## Resources Created

- **Resource Group**: Container for all resources
- **App Service Plan**: Linux-based plan with F1 (Free) or B1 (Basic) SKU
- **Linux Web App**: App Service instance

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) installed (v1.0+)
2. [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) installed
3. Azure subscription
4. Authenticated with Azure CLI:
   ```bash
   az login
   ```

## Configuration

### 1. Update `terraform.tfvars`

Edit `terraform.tfvars` and replace the placeholder values:

```hcl
subscription_id       = "your-actual-subscription-id"  # Get with: az account show --query id
resource_group_name   = "finance-rg"
location              = "eastus"                        # Change to desired region
app_service_name      = "finance-app-001"               # MUST be globally unique
sku_name              = "F1"                            # F1=Free, B1=Basic
```

**To find your subscription ID:**
```bash
az account show --query id --output tsv
```

### 2. Available SKUs

- **F1** (Free tier)
  - Limited features
  - Shared compute resources
  - 1 GB storage
  - Suitable for development/testing

- **B1** (Basic tier)
  - Dedicated compute resources
  - 10 GB storage
  - Better performance
  - Recommended for production

## Deployment

### Initialize Terraform

```bash
terraform init
```

### Validate Configuration

```bash
terraform validate
```

### Preview Changes

```bash
terraform plan
```

### Apply Configuration

```bash
terraform apply
```

When prompted, type `yes` to confirm.

### Get Outputs

After successful deployment:
```bash
terraform output
```

## Access Your App Service

Once deployed, access your application at:
```
https://<app_service_name>.azurewebsites.net
```

The URL is also available in the `app_service_url` output.

## Deployment Methods

The app service is configured for:
- **Git deployment** (Local Git)
- **GitHub integration**
- **Zip deployment**
- **Docker container** (requires additional configuration)

### Deploy Node.js App (Example)

```bash
# Build your app
npm install
npm run build

# Deploy via zip
cd dist
zip -r app.zip .
az webapp deployment source config-zip --resource-group finance-rg --name finance-app-001 --src-path app.zip
```

## Update Configuration

To change settings (e.g., upgrade to B1):

1. Edit `terraform.tfvars`
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply changes

## Destroy Resources

To delete all resources:

```bash
terraform destroy
```

When prompted, type `yes` to confirm.

## Troubleshooting

### App Name Not Available
The app name must be globally unique across all Azure. If you get an error, change it in `terraform.tfvars`.

### Authentication Issues
Ensure you're logged in to Azure:
```bash
az login
az account set --subscription "<subscription-id>"
```

### Terraform State
- Local state is stored in `terraform.tfstate`
- For team environments, use [remote state](https://www.terraform.io/language/state/remote)

## Additional Customization

Edit `main.tf` to add:
- Custom domain names
- SSL certificates
- Application settings/environment variables
- Database connections
- API management

## Support

For issues with:
- **Terraform**: [Terraform Azure Provider Docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- **Azure App Service**: [Azure Docs](https://docs.microsoft.com/azure/app-service/)
