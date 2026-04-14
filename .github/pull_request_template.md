# 🔄 Pull Request

## 📝 Description
Brief description of what this PR does and why it's needed.

## 🏷️ Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] ⚙️ Configuration change
- [ ] 🔧 CI/CD improvement
- [ ] 🎨 Code style/formatting
- [ ] ♻️ Refactoring
- [ ] 🧪 Adding tests

## 🎯 Services Affected
- [ ] Web Frontend
- [ ] Application Backend
- [ ] Database (MariaDB)
- [ ] API Gateway (Nginx)
- [ ] Authentication (Keycloak)
- [ ] Object Storage (MinIO)
- [ ] Monitoring (Prometheus/Grafana)
- [ ] DNS Server (BIND9)
- [ ] CI/CD Pipeline
- [ ] Documentation

## 🧪 Testing Checklist
- [ ] I have tested this locally
- [ ] All containers start up properly with `docker compose up -d`
- [ ] Health check passes: `./health-check.sh`
- [ ] Load balancer works correctly (if applicable)
- [ ] API endpoints respond correctly (if applicable)
- [ ] Database migrations work (if applicable)
- [ ] No breaking changes to existing functionality

## 🔍 Code Quality Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing tests pass locally with my changes

## 📚 Documentation Updates
- [ ] README.md updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] Configuration examples updated (if needed)
- [ ] Deployment instructions updated (if needed)

## 🔒 Security Considerations
- [ ] No sensitive data (passwords, keys, tokens) in code
- [ ] Environment variables used for configuration
- [ ] No new security vulnerabilities introduced
- [ ] Proper input validation added (if applicable)

## 📸 Screenshots (if applicable)
Add screenshots to help explain your changes.

## 🔗 Related Issues
Closes #(issue number)
Related to #(issue number)

## 🚀 Deployment Notes
Any special deployment considerations or steps:
- [ ] Requires database migration
- [ ] Requires environment variable changes
- [ ] Requires manual configuration
- [ ] Requires service restart
- [ ] No special deployment steps needed

## 📋 Reviewer Checklist
For reviewers to complete:
- [ ] Code review completed
- [ ] Testing instructions followed
- [ ] Documentation reviewed
- [ ] Security considerations reviewed
- [ ] Performance impact considered

## 💬 Additional Notes
Any additional information that reviewers should know.

---

**Note for Reviewers:** Please ensure all checkboxes are completed before approving this PR.