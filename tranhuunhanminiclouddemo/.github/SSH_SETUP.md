# 🔐 SSH Key Setup for CI/CD Deployment

This guide explains how to set up SSH keys for automated deployment to EC2 instances.

## 📋 Prerequisites

- EC2 instance(s) running Ubuntu
- SSH access to the EC2 instance(s)
- GitHub repository with this CI/CD module

## 🔑 Step 1: Generate SSH Key Pair

On your local machine:

```bash
# Generate a new SSH key pair for CI/CD
ssh-keygen -t rsa -b 4096 -C "cicd-deployment" -f ~/.ssh/cicd-key

# This creates:
# ~/.ssh/cicd-key (private key)
# ~/.ssh/cicd-key.pub (public key)
```

## 🖥️ Step 2: Configure EC2 Instance

### Add public key to EC2 instance:

```bash
# Copy public key to EC2 instance
ssh-copy-id -i ~/.ssh/cicd-key.pub ubuntu@YOUR_EC2_IP

# Or manually add to authorized_keys:
cat ~/.ssh/cicd-key.pub | ssh ubuntu@YOUR_EC2_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Test SSH connection:

```bash
ssh -i ~/.ssh/cicd-key ubuntu@YOUR_EC2_IP
```

## 🔒 Step 3: Configure GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

### Required Secrets:

```
DOCKER_USERNAME          # Your Docker Hub username
DOCKER_PASSWORD          # Your Docker Hub password or access token
```

### For Staging Environment:

```
STAGING_SSH_KEY          # Content of ~/.ssh/cicd-key (private key)
STAGING_HOST             # Your staging EC2 IP address
```

### For Production Environment:

```
PRODUCTION_SSH_KEY       # Content of ~/.ssh/cicd-key (private key)  
PRODUCTION_HOST          # Your production EC2 IP address
```

## 📝 Step 4: Add SSH Key Content to GitHub Secrets

### Get private key content:

```bash
# Display private key content
cat ~/.ssh/cicd-key

# Copy the entire output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# [key content]
# -----END OPENSSH PRIVATE KEY-----
```

### Add to GitHub Secrets:
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `STAGING_SSH_KEY` or `PRODUCTION_SSH_KEY`
4. Value: Paste the entire private key content
5. Click **Add secret**

## 🖥️ Step 5: Prepare EC2 Instance

### Install required software on EC2:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Git
sudo apt install git -y

# Restart to apply group changes
sudo reboot
```

### Clone your repository on EC2:

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/MyMiniCloud.git
cd MyMiniCloud/tranhuunhanminiclouddemo

# Test initial setup
docker compose up -d
./health-check.sh
```

## 🔧 Step 6: Configure Deployment Paths

Update the deployment paths in your CI/CD configuration:

### In `.github/configs/project-config.yml`:

```yaml
deployment:
  staging:
    deploy_path: "/home/ubuntu/MyMiniCloud/tranhuunhanminiclouddemo"
  production:
    deploy_path: "/home/ubuntu/MyMiniCloud/tranhuunhanminiclouddemo"
```

## 🧪 Step 7: Test Deployment

### Test staging deployment:

1. Push to `develop` branch
2. Check GitHub Actions for deployment status
3. Verify deployment on staging server

### Test production deployment:

1. Create PR from `develop` to `main`
2. Merge PR after approval
3. Check GitHub Actions for deployment status
4. Verify deployment on production server

## 🔒 Security Best Practices

### 1. Use Separate Keys
- Use different SSH keys for staging and production
- Rotate keys regularly

### 2. Limit SSH Access
```bash
# On EC2, edit SSH config
sudo nano /etc/ssh/sshd_config

# Add these lines:
AllowUsers ubuntu
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH service
sudo systemctl restart sshd
```

### 3. Use Security Groups
- Limit SSH access (port 22) to specific IP ranges
- Only open necessary ports (80, 443, etc.)

### 4. Monitor Access
```bash
# Check SSH login attempts
sudo tail -f /var/log/auth.log
```

## 🚨 Troubleshooting

### Common Issues:

#### 1. Permission Denied
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/cicd-key
chmod 644 ~/.ssh/cicd-key.pub

# Check authorized_keys permissions on EC2
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### 2. Host Key Verification Failed
```bash
# Add EC2 host to known_hosts
ssh-keyscan -H YOUR_EC2_IP >> ~/.ssh/known_hosts
```

#### 3. Deployment Script Fails
```bash
# Check if user has docker permissions
groups ubuntu

# Should include 'docker' group
# If not, run: sudo usermod -aG docker ubuntu
```

#### 4. GitHub Actions SSH Issues
- Verify SSH key format in GitHub Secrets
- Check EC2 security group allows SSH (port 22)
- Verify EC2 instance is running

## 📋 Deployment Checklist

Before first deployment:

- [ ] SSH key pair generated
- [ ] Public key added to EC2 authorized_keys
- [ ] Private key added to GitHub Secrets
- [ ] EC2 instance has Docker and Git installed
- [ ] Repository cloned on EC2
- [ ] Deployment paths configured
- [ ] Security groups configured
- [ ] Test SSH connection works
- [ ] Test manual deployment works

## 🔄 Key Rotation

To rotate SSH keys:

1. Generate new key pair
2. Add new public key to EC2
3. Update GitHub Secrets with new private key
4. Test deployment
5. Remove old public key from EC2

---

**⚠️ Important:** Never commit private keys to your repository. Always use GitHub Secrets for sensitive information.