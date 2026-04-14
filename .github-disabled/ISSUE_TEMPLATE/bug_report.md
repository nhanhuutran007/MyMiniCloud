---
name: 🐛 Bug Report
about: Create a report to help us improve the project
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## ✅ Expected Behavior
A clear and concise description of what you expected to happen.

## 📸 Screenshots
If applicable, add screenshots to help explain your problem.

## 🖥️ Environment Information
**Please complete the following information:**
- OS: [e.g. Windows 11, macOS 13, Ubuntu 22.04]
- Docker version: [e.g. 24.0.0]
- Docker Compose version: [e.g. 2.20.0]
- Browser: [e.g. Chrome 118, Firefox 119]
- Project version/commit: [e.g. main branch, commit abc123]

## 🐳 Docker Information
**Which services are affected:**
- [ ] Web Frontend
- [ ] Application Backend
- [ ] Database (MariaDB)
- [ ] API Gateway (Nginx)
- [ ] Authentication (Keycloak)
- [ ] Object Storage (MinIO)
- [ ] Monitoring (Prometheus/Grafana)
- [ ] DNS Server (BIND9)
- [ ] Other: ___________

## 📋 Logs and Output
**Container logs (if applicable):**
```
Paste relevant logs here
```

**Health check results:**
```
Run ./health-check.sh and paste results here
```

**Docker Compose status:**
```
Run docker compose ps and paste results here
```

## 🔍 Additional Context
Add any other context about the problem here.

## ✅ Checklist
- [ ] I have searched existing issues to ensure this is not a duplicate
- [ ] I have included all relevant information above
- [ ] I have tested this on the latest version
- [ ] I have run the health check script