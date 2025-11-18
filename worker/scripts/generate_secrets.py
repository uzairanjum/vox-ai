#!/usr/bin/env python3
"""
Security Token Generator for Vox Cron AI
Generates cryptographically secure tokens and secrets for production deployment.
"""

import secrets
import string
import os
import sys
from typing import Dict, List, Tuple
import argparse
import datetime


def generate_api_secret_key(length: int = 64) -> str:
    """Generate a secure API secret key"""
    return secrets.token_urlsafe(length)


def generate_api_access_token(length: int = 32) -> str:
    """Generate a secure API access token"""
    return f"vox_{secrets.token_urlsafe(length)}"


def generate_webhook_secret(length: int = 64) -> str:
    """Generate a secure webhook secret"""
    return secrets.token_urlsafe(length)


def generate_strong_password(length: int = 20) -> str:
    """Generate a strong password with mixed characters"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_uuid() -> str:
    """Generate a secure UUID-like string"""
    return secrets.token_hex(16)


def generate_jwt_secret(length: int = 64) -> str:
    """Generate a secure JWT signing secret"""
    return secrets.token_urlsafe(length)


def validate_environment() -> List[str]:
    """Validate current environment variables and return warnings"""
    warnings = []
    
    # Check for development secrets in production
    if os.getenv('APP_ENV') == 'production':
        if os.getenv('API_SECRET_KEY') == 'development-secret-change-in-production':
            warnings.append("API_SECRET_KEY is still set to development default!")
        
        if os.getenv('ALLOWED_ORIGINS') == '*':
            warnings.append("ALLOWED_ORIGINS should not be '*' in production!")
        
        if os.getenv('ENABLE_API_AUTH', 'false').lower() != 'true':
            warnings.append("ENABLE_API_AUTH should be 'true' in production!")
    
    return warnings


def generate_env_template(secrets_dict: Dict[str, str]) -> str:
    """Generate environment variable template with generated secrets"""
    template = f"""# =================================================================
# GENERATED SECURITY CONFIGURATION
# =================================================================
# Generated on: { datetime.datetime.now().isoformat()}
# IMPORTANT: Keep these secrets secure and never commit to version control!

# Security Configuration
API_SECRET_KEY={secrets_dict['api_secret_key']}
API_ACCESS_TOKEN={secrets_dict['api_access_token']}
WEBHOOK_SECRET={secrets_dict['webhook_secret']}

# Production Security Settings (recommended)
ENABLE_API_AUTH=true
ENABLE_WEBHOOK_AUTH=true
FORCE_HTTPS=true
LOG_SENSITIVE_DATA=false
ANONYMIZE_LOGS=true

# CORS Configuration (update with your actual domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Rate Limiting (adjust based on your needs)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=200
RATE_LIMIT_PER_IP=50

# Additional secure configurations
APP_ENV=production
LOG_LEVEL=INFO
WORKERS=4

# =================================================================
# ADD YOUR SERVICE CREDENTIALS BELOW
# =================================================================

# Database Configuration - Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key-here

# GoHighLevel Configuration
GHL_ACCESS_TOKEN=your-ghl-access-token-here
GHL_REFRESH_TOKEN=your-ghl-refresh-token-here

# AI Backend Configuration
AI_BACKEND_URL=https://your-ai-backend.com/api
AI_BACKEND_API_KEY=your-ai-backend-api-key-here

# Optional: Redis for enhanced performance
# REDIS_URL=redis://your-redis-host:6379

# Optional: Monitoring
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
"""
    return template


def main():
    parser = argparse.ArgumentParser(description='Generate secure tokens for Vox Cron AI')
    parser.add_argument('--output', '-o', help='Output file for environment variables')
    parser.add_argument('--validate', '-v', action='store_true', help='Validate current environment')
    parser.add_argument('--format', choices=['env', 'json', 'yaml'], default='env', help='Output format')
    parser.add_argument('--quiet', '-q', action='store_true', help='Suppress output except errors')
    
    args = parser.parse_args()
    
    if args.validate:
        warnings = validate_environment()
        if warnings:
            print("⚠️  Environment Validation Warnings:")
            for warning in warnings:
                print(f"   - {warning}")
            sys.exit(1)
        else:
            print("✅ Environment validation passed!")
            sys.exit(0)
    
    # Generate all secrets
    secrets_dict = {
        'api_secret_key': generate_api_secret_key(),
        'api_access_token': generate_api_access_token(),
        'webhook_secret': generate_webhook_secret(),
        'jwt_secret': generate_jwt_secret(),
        'admin_password': generate_strong_password(),
        'session_id': generate_uuid()
    }
    
    if not args.quiet:
        print("🔐 Generated Secure Tokens and Secrets")
        print("=" * 50)
        
        for key, value in secrets_dict.items():
            # Mask the actual values for security
            masked_value = value[:8] + "..." + value[-8:] if len(value) > 16 else "***"
            print(f"{key.upper()}: {masked_value}")
        
        print("\n📋 Security Recommendations:")
        print("   - Store these secrets in a secure password manager")
        print("   - Never commit secrets to version control")
        print("   - Use different secrets for each environment")
        print("   - Rotate secrets regularly (quarterly recommended)")
        print("   - Monitor for secret exposure in logs/errors")
    
    # Output to file if requested
    if args.output:
        if args.format == 'env':
            content = generate_env_template(secrets_dict)
        elif args.format == 'json':
            import json
            content = json.dumps(secrets_dict, indent=2)
        elif args.format == 'yaml':
            try:
                import yaml
                content = yaml.dump(secrets_dict, default_flow_style=False)
            except ImportError:
                print("❌ PyYAML not installed. Install with: pip install PyYAML")
                sys.exit(1)
        
        try:
            with open(args.output, 'w') as f:
                f.write(content)
            
            # Set secure permissions on the file
            os.chmod(args.output, 0o600)
            
            if not args.quiet:
                print(f"\n✅ Secrets written to: {args.output}")
                print(f"   File permissions set to 600 (owner read/write only)")
        except Exception as e:
            print(f"❌ Error writing to file: {e}")
            sys.exit(1)
    else:
        # Print to stdout
        if args.format == 'env':
            print("\n" + "=" * 50)
            print("ENVIRONMENT VARIABLES (copy to .env file):")
            print("=" * 50)
            for key, value in secrets_dict.items():
                print(f"{key.upper()}={value}")
        elif args.format == 'json':
            import json
            print(json.dumps(secrets_dict, indent=2))
        elif args.format == 'yaml':
            try:
                import yaml
                print(yaml.dump(secrets_dict, default_flow_style=False))
            except ImportError:
                print("❌ PyYAML not installed. Install with: pip install PyYAML")
                sys.exit(1)
    
    if not args.quiet:
        print("\n🚀 Next Steps:")
        print("   1. Copy the secrets to your .env file")
        print("   2. Update the service credentials (Supabase, GHL, AI Backend)")
        print("   3. Test the configuration with: python -c 'from config import settings; settings.validate_security_config()'")
        print("   4. Deploy to production with HTTPS enabled")


if __name__ == "__main__":
    main() 