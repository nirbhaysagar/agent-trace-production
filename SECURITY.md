# 🔒 AgentTrace Security Guide

## Overview

AgentTrace implements comprehensive security measures to protect user data, prevent attacks, and ensure production readiness. This document outlines all security features and best practices.

## 🛡️ Security Features Implemented

### 1. Authentication & Authorization

#### JWT-Based Authentication
- **Implementation**: `backend/security.py`
- **Features**:
  - JWT token generation and validation
  - Password hashing with bcrypt
  - Token expiration (30 minutes default)
  - Secure secret key management

```python
# Generate JWT token
token = create_access_token({"sub": username})

# Verify token
username = verify_token(credentials)
```

#### Authentication Endpoints (Future)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### 2. Rate Limiting

#### In-Memory Rate Limiter
- **Implementation**: `RateLimiter` class in `security.py`
- **Configuration**:
  - 100 requests per hour per IP
  - Configurable via environment variables
  - Automatic cleanup of old entries

```python
# Rate limiting middleware
def check_rate_limit(request: Request):
    client_ip = get_client_ip(request)
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
```

### 3. Input Validation & Sanitization

#### Data Sanitization
- **Sensitive Data Removal**: Automatically removes API keys, passwords, tokens
- **Pattern Matching**: Uses regex patterns to identify sensitive information
- **Recursive Processing**: Handles nested objects and arrays

```python
# Sanitize trace data
sanitized_data = sanitize_trace_data(raw_data)

# Sensitive patterns removed:
# - api_key: "secret123" → api_key: "[REDACTED]"
# - password: "mypass" → password: "[REDACTED]"
```

#### Input Validation
- **File Type Validation**: Only JSON files allowed
- **Size Limits**: 10MB max file size, 5MB max trace size
- **Structure Validation**: Ensures valid trace data format
- **Step Limits**: Maximum 1000 steps per trace

### 4. CORS & Security Headers

#### CORS Configuration
```python
# Production CORS setup
allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://yourdomain.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

#### Security Headers (Frontend)
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ]
}
```

### 5. File Upload Security

#### Secure File Handling
- **Filename Sanitization**: Removes path components and special characters
- **Secure Naming**: Adds timestamp and random suffix
- **Content Validation**: Validates JSON structure before processing
- **Size Enforcement**: Multiple size checks at different levels

```python
# Secure filename generation
secure_filename = generate_secure_filename("trace.json")
# Result: trace_20240115_143022_a1b2c3d4.json
```

### 6. Database Security

#### Supabase Integration
- **Row Level Security (RLS)**: Database-level access control
- **Connection Pooling**: Prevents connection exhaustion
- **Query Sanitization**: Prevents SQL injection
- **Encrypted Connections**: TLS/SSL for all database connections

#### Data Protection
- **Sensitive Data Filtering**: Removes API keys before storage
- **Audit Logging**: Tracks all database operations
- **Backup Encryption**: Encrypted database backups

## 🔧 Security Configuration

### Environment Variables

#### Required for Production
```bash
# Security
JWT_SECRET_KEY=your_super_secure_jwt_secret_key_here_minimum_32_characters
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

#### Optional Security Features
```bash
# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Additional Security
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
CSP_POLICY=default-src 'self'; script-src 'self' 'unsafe-inline'
```

### Security Levels

#### Development Mode
- Relaxed CORS for localhost
- Debug logging enabled
- No rate limiting
- Basic validation

#### Production Mode
- Strict CORS configuration
- Full rate limiting
- Comprehensive validation
- Security headers enabled
- Error tracking

## 🚨 Security Threats & Mitigations

### 1. Injection Attacks

#### SQL Injection
- **Mitigation**: Supabase uses parameterized queries
- **Protection**: Row Level Security (RLS)
- **Monitoring**: Query logging and analysis

#### JSON Injection
- **Mitigation**: Pydantic validation
- **Protection**: Structure validation before processing
- **Sanitization**: Automatic data cleaning

### 2. Cross-Site Scripting (XSS)

#### Prevention
- **Content Security Policy**: Restricts script execution
- **Input Sanitization**: Removes malicious content
- **Output Encoding**: Proper HTML encoding

#### Headers
```javascript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'Content-Security-Policy': "default-src 'self'"
```

### 3. Cross-Site Request Forgery (CSRF)

#### Protection
- **SameSite Cookies**: Prevents cross-site requests
- **CSRF Tokens**: Validates request authenticity
- **Origin Validation**: Checks request origin

### 4. File Upload Attacks

#### Prevention
- **File Type Validation**: Only JSON files allowed
- **Size Limits**: Prevents large file attacks
- **Content Scanning**: Validates file content
- **Secure Storage**: Isolated file handling

### 5. Rate Limiting & DoS

#### Protection
- **Request Limiting**: 100 requests/hour per IP
- **Resource Limits**: CPU and memory protection
- **Circuit Breakers**: Automatic failure handling
- **Monitoring**: Real-time attack detection

## 🔍 Security Monitoring

### Logging & Auditing

#### Security Events Logged
- Authentication attempts (success/failure)
- Rate limit violations
- File upload attempts
- Data sanitization actions
- Database access patterns

#### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "WARNING",
  "event": "rate_limit_exceeded",
  "client_ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "endpoint": "/api/traces/upload"
}
```

### Error Tracking

#### Sentry Integration
- **Error Monitoring**: Real-time error tracking
- **Performance Monitoring**: API response times
- **User Context**: Enhanced error reporting
- **Release Tracking**: Version-based error analysis

### Health Checks

#### Security Health Monitoring
- **Authentication Service**: JWT validation status
- **Rate Limiter**: Memory usage and performance
- **Database**: Connection pool health
- **File System**: Storage availability

## 🚀 Production Deployment Security

### Pre-Deployment Checklist

#### Security Configuration
- [ ] JWT secret key generated and secure
- [ ] CORS origins configured for production domains
- [ ] Rate limiting enabled and configured
- [ ] Security headers implemented
- [ ] SSL/TLS certificates installed
- [ ] Database RLS policies configured
- [ ] Error tracking configured
- [ ] Backup strategy implemented

#### Environment Setup
- [ ] Production environment variables set
- [ ] Database credentials secured
- [ ] API keys rotated and secured
- [ ] Monitoring tools configured
- [ ] Log aggregation setup

### Deployment Security

#### Container Security
```dockerfile
# Use non-root user
USER 1000:1000

# Remove unnecessary packages
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Set security headers
ENV SECURE_HEADERS=True
```

#### Infrastructure Security
- **Load Balancer**: SSL termination and DDoS protection
- **CDN**: Content delivery with security features
- **Firewall**: Network-level protection
- **Monitoring**: Real-time security monitoring

## 🔐 Data Privacy & Compliance

### Data Handling

#### Sensitive Data Protection
- **Automatic Detection**: Identifies API keys, passwords, tokens
- **Redaction**: Replaces sensitive data with `[REDACTED]`
- **Audit Trail**: Logs all data sanitization actions
- **Retention**: Configurable data retention policies

#### User Data Rights
- **Data Export**: Users can export their trace data
- **Data Deletion**: Users can delete their traces
- **Data Portability**: Standard JSON format for data export
- **Consent Management**: Clear data usage policies

### Compliance Features

#### GDPR Compliance
- **Data Minimization**: Only necessary data collected
- **Purpose Limitation**: Data used only for stated purposes
- **Storage Limitation**: Automatic data expiration
- **Right to Erasure**: User data deletion capabilities

#### SOC 2 Compliance
- **Access Controls**: Role-based access management
- **Audit Logging**: Comprehensive activity logging
- **Data Encryption**: Encryption in transit and at rest
- **Incident Response**: Security incident procedures

## 🛠️ Security Tools & Utilities

### Development Tools

#### Security Testing
```bash
# Run security tests
python -m pytest tests/security/

# Check for vulnerabilities
pip install safety
safety check

# Code analysis
pip install bandit
bandit -r backend/
```

#### Security Scanning
```bash
# Dependency scanning
npm audit
pip install pip-audit
pip-audit

# Container scanning
docker run --rm -v $(pwd):/app securecodewarrior/docker-security-scan
```

### Monitoring Tools

#### Security Dashboards
- **Sentry**: Error tracking and performance monitoring
- **Supabase Dashboard**: Database security monitoring
- **Vercel Analytics**: Frontend security metrics
- **Custom Logs**: Security event aggregation

## 📚 Security Best Practices

### For Developers

#### Code Security
- **Input Validation**: Always validate user input
- **Output Encoding**: Properly encode output data
- **Error Handling**: Don't expose sensitive information
- **Dependency Management**: Keep dependencies updated

#### API Security
- **Authentication**: Require authentication for sensitive endpoints
- **Authorization**: Implement proper access controls
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Input Sanitization**: Clean all input data

### For Administrators

#### System Security
- **Regular Updates**: Keep all systems updated
- **Access Control**: Implement least privilege principle
- **Monitoring**: Monitor for suspicious activity
- **Backup Security**: Secure backup storage and access

#### Incident Response
- **Detection**: Monitor for security incidents
- **Response**: Have incident response procedures
- **Recovery**: Plan for system recovery
- **Learning**: Post-incident analysis and improvement

## 🔄 Security Updates & Maintenance

### Regular Security Tasks

#### Weekly
- [ ] Review security logs
- [ ] Check for dependency updates
- [ ] Monitor rate limiting metrics
- [ ] Review error tracking reports

#### Monthly
- [ ] Security audit of code changes
- [ ] Review and update security policies
- [ ] Test backup and recovery procedures
- [ ] Update security documentation

#### Quarterly
- [ ] Comprehensive security review
- [ ] Penetration testing
- [ ] Security training for team
- [ ] Update security tools and processes

### Security Incident Response

#### Incident Classification
- **Low**: Minor security issues, no data exposure
- **Medium**: Potential data exposure, limited impact
- **High**: Confirmed data exposure, significant impact
- **Critical**: System compromise, widespread impact

#### Response Procedures
1. **Detection**: Identify and classify the incident
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze the incident scope
4. **Recovery**: Restore normal operations
5. **Post-Incident**: Document lessons learned

## 📞 Security Support

### Reporting Security Issues

#### Vulnerability Disclosure
- **Email**: security@agenttrace.com
- **PGP Key**: Available on security page
- **Response Time**: 24 hours for critical issues
- **Bounty Program**: Rewards for valid vulnerabilities

#### Security Questions
- **Documentation**: This security guide
- **Community**: GitHub discussions
- **Support**: Technical support team
- **Training**: Security awareness training

---

## 🎯 Security Checklist for Production

### Pre-Launch Security Review

- [ ] **Authentication**: JWT implementation tested
- [ ] **Authorization**: Access controls verified
- [ ] **Input Validation**: All endpoints protected
- [ ] **Rate Limiting**: DoS protection active
- [ ] **Data Sanitization**: Sensitive data filtering
- [ ] **CORS Configuration**: Production origins set
- [ ] **Security Headers**: All headers implemented
- [ ] **SSL/TLS**: Certificates installed and valid
- [ ] **Database Security**: RLS policies configured
- [ ] **Error Handling**: No sensitive data exposure
- [ ] **Logging**: Security events logged
- [ ] **Monitoring**: Error tracking configured
- [ ] **Backup Security**: Encrypted backups
- [ ] **Documentation**: Security procedures documented
- [ ] **Team Training**: Security awareness completed

### Ongoing Security Maintenance

- [ ] **Regular Updates**: Dependencies and systems
- [ ] **Security Monitoring**: Continuous monitoring
- [ ] **Incident Response**: Procedures tested
- [ ] **Audit Logs**: Regular review
- [ ] **Penetration Testing**: Quarterly testing
- [ ] **Security Training**: Team education
- [ ] **Policy Updates**: Security policies current
- [ ] **Compliance**: Regulatory requirements met

---

**Remember**: Security is an ongoing process, not a one-time implementation. Regular reviews, updates, and monitoring are essential for maintaining a secure application.
