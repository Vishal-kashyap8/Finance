# Azure DevOps pipeline for GitHub-based deployment

This repository includes a pipeline file named `azure-pipelines.yml` that deploys:

1. Azure infrastructure via Terraform
2. The application code to the Azure App Service Linux web app

It is designed to use GitHub as the source repository, not Azure Repos.

## Azure DevOps setup

1. Open Azure DevOps.
2. Create a new pipeline.
3. Choose `GitHub` as the repository source.
4. Authorize GitHub and select this repository.
5. Choose `Existing Azure Pipelines YAML file`.
6. Select `azure-pipelines.yml` from the repository root.

## Required Azure resources

Before enabling the pipeline, create an Azure DevOps service connection:

- Service connection type: Azure Resource Manager
- Authentication: Service principal (manual)
- Scope: your Azure subscription / resource group

Name it exactly:

- `finance-azure-service-connection`

This is referenced in the pipeline as `azureSubscription`.

## Required pipeline variables

In Azure DevOps > Pipelines > Library > + Variable group or pipeline variables, add these values:

- `ARM_CLIENT_ID`
- `ARM_CLIENT_SECRET`
- `ARM_TENANT_ID`
- `ARM_SUBSCRIPTION_ID`

These are used by Terraform to authenticate to Azure.

## Branch strategy

The pipeline triggers on `main`:

- On push to `main`
- On pull requests targeting `main`

## What the pipeline does

### Stage 1: Infrastructure

- Installs Terraform
- Runs `terraform init`
- Runs `terraform validate`
- Runs `terraform plan`
- Runs `terraform apply`

This creates or updates the resource group and App Service resources defined in the Infrastructure folder.

### Stage 2: Application deployment

- Installs Node.js 20
- Builds a ZIP package from the backend + frontend
- Configures App Service settings
- Deploys the ZIP package using Azure Web App deployment

## Notes

- The app runs on a Linux App Service plan and uses a Node.js runtime.
- The web app name is expected to be `finance-app-001`.
- The resource group is expected to be `finance-rg`.
- The App Service plan is expected to be `finance-app-plan`.
- If you use a different name or region, update the variables in `azure-pipelines.yml`.

## Common fixes

If the deployment fails:

1. Make sure the pipeline is using the GitHub repo and not Azure Repos.
2. Ensure the Azure service connection exists and has Contributor access.
3. Ensure the GitHub repository is connected with proper permissions.
4. Verify the app name is globally unique in Azure.
5. Make sure your Terraform variables match your Azure subscription.

## Quick command to validate the YAML locally

```bash
python -c "import yaml,sys; yaml.safe_load(open('azure-pipelines.yml')); print('YAML OK')"
```
