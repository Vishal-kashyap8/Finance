# Azure SQL Database Deployment

The infrastructure provisions the Linux App Service plan and Azure SQL logical server. The pipeline creates the `FinanceTracker` database with the Azure SQL free offer and configures the application for encrypted SQL connections.

## Required Before Running the Pipeline

- Confirm `finance-sql-server-001` is available globally, or change `sql_server_name` in `variables.tf` and `sqlServerName` in `azure-pipelines.yml` to the same unique name.
- Confirm the `Finance-connection` Azure DevOps service connection is valid. Grant the service principal behind it permission to manage the resource group, SQL server/database, and App Service.
- Create an Azure Storage account and a `tfstate` blob container for remote Terraform state. Grant the pipeline identity `Storage Blob Data Contributor` on the storage account. Set pipeline variables `TFSTATE_RESOURCE_GROUP` and `TFSTATE_STORAGE_ACCOUNT` to its names.
- Add these as pipeline variables in Azure DevOps. Mark every password/key as secret; do not put values in source files or chat. If using a variable group, reference it from the YAML pipeline:
  - `SQL_ADMIN_PASSWORD`: strong password for the logical server administrator. Terraform state contains this value in plain text, so protect the state file and do not commit it.
  - `DB_USER` and `DB_PASSWORD`: a dedicated, least-privilege database user for the app. Do not use the SQL administrator account for normal app access.
  - `DB_ENCRYPT_KEY`: strong passphrase used by the Banking Profiles encryption functions. Back it up securely; losing it makes existing encrypted fields unreadable.
  - `APP_USER` and `APP_PASSWORD`: login credentials currently checked by the app's login endpoint.
- Before the first pipeline run, from `Infrastructure/` on the machine that has the current `terraform.tfstate`, run `terraform init -migrate-state` with the same backend settings (`resource_group_name`, `storage_account_name`, `container_name=tfstate`, `key=finance.tfstate`, and `use_azuread_auth=true`). This copies the existing state to Azure Storage. The pipeline uses that remote state afterward; do not use `-reconfigure` locally before the migration completes.
- Confirm the subscription permits the Azure SQL free offer and that you are comfortable with the database pausing until the next month when its free allowance is exhausted.

## Database and Data

The pipeline opts into the Azure SQL free offer with serverless compute and `AutoPause` on free-limit exhaustion. The offer currently includes up to 10 General Purpose databases per subscription, each with monthly compute and storage allowances. It is not an unlimited free database; review current limits and usage in the Azure portal.

The new database starts empty. To create its tables, connect to `FinanceTracker` using SSMS or Azure Data Studio and run `db/schema.sql`, followed by the migration scripts listed in the root README. These scripts no longer switch database context internally. For a laptop connection, temporarily add your current public IP as an Azure SQL firewall rule, then remove it after setup; do not enable the broad "Allow Azure services" firewall option. Create a contained SQL user in that database for the app and grant only the required data-reader/data-writer roles; then place its credentials in the secret variables above.

If you want to preserve existing local data, export it from the local SQL Server and import it into the Azure SQL Database before switching the app over. Verify the Banking Profiles encryption key is the same as the key used for the existing rows.

## Important Deployment Blockers

- The App Service pipeline configures SQL firewall rules for the web app's possible outbound IPs. It does not configure the database schema or create the app database user.
- The current login endpoint does not issue a session/token, and the data API routes are not protected by authentication middleware. Do not expose real financial data publicly until API authorization is implemented and verified.
- Terraform's local state files are ignored by Git. Use a durable remote backend before running Terraform from Azure DevOps.
- F1 App Service is suitable for experiments, not production availability. The Azure SQL free offer can pause after monthly limits; the app must tolerate database unavailability in that state.