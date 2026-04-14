# 🚀 Universal CI/CD Module

This `.github` directory contains a reusable CI/CD module that can be adapted for any Docker Compose-based project.

## 📁 Structure

```
.github/
├── configs/
│   └── project-config.yml      # Project-specific configuration
├── scripts/
│   ├── deploy.sh              # Universal deployment script
│   └── universal-health-check.sh # Universal health check script
├── workflows/
│   ├── ci-cd.yml              # Main CI/CD pipeline
│   └── pr-validation.yml      # Pull request validation
├── ISSUE_TEMPLATE/
│   ├── bug_report.md          # Bug report template
│   └── feature_request.md     # Feature request template
├── pull_request_template.md   # Pull request template
└── README.md                  # This file
```

## 🔧 How to Adapt for Other Projects

### 1. Update Project Configuration
Edit `.github/configs/project-config.yml`:

```yaml
project:
  name: "YourProjectName"
  type: "docker-compose"
  main_directory: "your-project-directory"

docker:
  services:
    - name: "your-service-1"
      dockerfile_path: "./your-service-1"
      image_name: "your-image-1"
    - name: "your-service-2"
      dockerfile_path: "./your-service-2"
      image_name: "your-image-2"

testing:
  health_check_script: "./your-health-check.sh"
  api_tests:
    - endpoint: "/your/api/endpoint"
      expected_status: 200
```

### 2. Customize Deployment Script
The `deploy.sh` script uses environment variables:

```bash
export PROJECT_NAME="YourProject"
export DEPLOY_PATH="/path/to/your/project"
export BRANCH="main"
export HEALTH_CHECK_SCRIPT="./your-health-check.sh"
```

### 3. Update GitHub Secrets
Required secrets for your repository:

```
DOCKER_USERNAME          # Docker Hub username
DOCKER_PASSWORD          # Docker Hub password
STAGING_SSH_KEY          # SSH private key for staging server
STAGING_HOST             # Staging server IP/hostname
PRODUCTION_SSH_KEY       # SSH private key for production server
PRODUCTION_HOST          # Production server IP/hostname
```

### 4. Customize Health Checks
The universal health check script can be configured via environment variables:

```bash
export PROJECT_NAME="YourProject"
export TIMEOUT=30
export HOST="localhost"  # or auto-detected
```

## 🎯 Features

### ✅ Automated Testing
- Docker Compose validation
- Security scanning with Trivy
- Multi-service Docker builds
- Integration testing
- Health checks
- API endpoint testing
- Load balancer testing

### 🚀 Deployment Automation
- Multi-environment support (staging/production)
- SSH-based deployment
- Automatic backups
- Health checks after deployment
- Rollback on failure

### 🔒 Security & Quality
- Vulnerability scanning
- Secrets detection
- Code quality checks
- Dockerfile linting
- Documentation validation

### 👥 Team Collaboration
- Issue templates
- Pull request templates
- Automated PR validation
- Deployment approvals

## 🔄 Workflow Triggers

### Main CI/CD Pipeline (`ci-cd.yml`)
- **Push to `main`**: Full pipeline + production deployment
- **Push to `develop`**: Full pipeline + staging deployment
- **Pull Request**: Testing only (no deployment)

### PR Validation (`pr-validation.yml`)
- **Pull Request to `main` or `develop`**: Quick validation checks

## 📋 Customization Checklist

When adapting this module for a new project:

- [ ] Update `project-config.yml` with your project details
- [ ] Modify service names in workflows
- [ ] Update API endpoints for testing
- [ ] Customize health check script
- [ ] Update deployment paths and branches
- [ ] Configure GitHub secrets
- [ ] Test the pipeline with a sample commit
- [ ] Update issue/PR templates with project-specific information

## 🛠️ Local Testing

To test the scripts locally:

```bash
# Test health check
./.github/scripts/universal-health-check.sh

# Test deployment (dry run)
export PROJECT_NAME="MyProject"
export DEPLOY_PATH="/path/to/project"
export BRANCH="main"
./.github/scripts/deploy.sh
```

## 📚 Best Practices

1. **Environment Variables**: Use environment variables for all configuration
2. **Secrets Management**: Never commit secrets, use GitHub Secrets
3. **Health Checks**: Always implement comprehensive health checks
4. **Rollback Strategy**: Ensure deployments can be rolled back
5. **Documentation**: Keep documentation updated with changes
6. **Testing**: Test all changes in staging before production

## 🤝 Contributing

When contributing to this CI/CD module:

1. Test changes with multiple project types
2. Maintain backward compatibility
3. Update documentation
4. Add appropriate error handling
5. Follow security best practices

## 📞 Support

For issues with this CI/CD module:
1. Check the workflow logs in GitHub Actions
2. Verify all required secrets are configured
3. Test scripts locally first
4. Create an issue with detailed information

---

**This module is designed to be project-agnostic and reusable. Customize the configuration files rather than modifying the core workflows when possible.**