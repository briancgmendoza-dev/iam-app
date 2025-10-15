# Production OPA Implementation Guide

## 🚀 Production-Ready Features

### ✅ **Security**
- **Fail-secure by default** - All errors result in access denial
- **Input validation** - Comprehensive validation of all inputs
- **Rate limiting** - Per-user rate limiting to prevent abuse
- **Audit logging** - Complete audit trail for compliance
- **Admin activity tracking** - Special monitoring for administrative actions

### ✅ **Performance**
- **Real OPA WASM integration** - Uses actual compiled OPA policies
- **Intelligent caching** - 5-minute TTL with automatic cleanup
- **Batch evaluation** - Process multiple requests efficiently
- **Metrics collection** - Performance monitoring and alerting
- **Memory management** - Bounded cache with LRU eviction

### ✅ **Reliability**
- **Health checks** - Comprehensive service health monitoring
- **Graceful degradation** - Fallback policies when WASM fails
- **Circuit breaker pattern** - Prevents cascade failures
- **Timeout handling** - Request-level timeouts
- **Error boundaries** - Isolated error handling

### ✅ **Monitoring**
- **Real-time metrics** - Cache hit rates, evaluation times, error rates
- **Audit trails** - Complete access logs for compliance
- **Performance tracking** - Average response times and throughput
- **Health dashboards** - Service status and system metrics

## 📋 **Deployment Checklist**

### 1. **Prerequisites**
```bash
# Install OPA CLI for policy compilation
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64_static
chmod +x opa
sudo mv opa /usr/local/bin/
```

### 2. **Build Process**
```bash
# Compile policies to WASM
npm run compile-policies

# Build application
npm run build

# Verify OPA bundle exists
ls -la dist/policies/bundle.tar.gz
```

### 3. **Environment Configuration**
```bash
# Production environment variables
export NODE_ENV=production
export LOG_LEVEL=info
export OPA_BUNDLE_PATH=/app/dist/policies/bundle.tar.gz

# Optional: External policy server
export OPA_SERVER_URL=https://your-opa-server.com
export OPA_API_KEY=your-api-key
```

### 4. **Health Check Endpoints**
```bash
# Public health check (no auth required)
GET /policies/health

# Detailed status (requires auth)
GET /policies/status

# Performance metrics
GET /policies/metrics
```

### 5. **Monitoring Setup**
```javascript
// Example monitoring integration
const metrics = await fetch('/policies/metrics');
const data = await metrics.json();

// Alert on high error rate
if (data.metrics.errorRate > 0.01) {
  sendAlert('OPA Error Rate High: ' + data.metrics.errorRate);
}

// Alert on slow performance
if (data.metrics.averageEvaluationTime > 100) {
  sendAlert('OPA Slow Response: ' + data.metrics.averageEvaluationTime + 'ms');
}
```

## 🔧 **Production Configuration**

### Cache Settings
```typescript
// Adjust in opa.service.ts
private readonly cacheSize = 50000;        // Increase for production
private readonly defaultCacheTtl = 600000; // 10 minutes
```

### Rate Limiting
```typescript
// Adjust per your requirements
private readonly rateLimit = 1000;         // requests per minute
private readonly rateLimitWindow = 60000;  // 1 minute
```

### Security Settings
```typescript
// Input size limits
private readonly maxInputSize = 1024 * 1024; // 1MB max
```

## 📊 **Monitoring Dashboard**

### Key Metrics to Track
1. **Availability**: Service uptime and health status
2. **Performance**: Average evaluation time, cache hit rate
3. **Security**: Failed access attempts, admin actions
4. **Errors**: Error rate, failed evaluations
5. **Usage**: Total evaluations, batch requests

### Sample Grafana Queries
```promql
# Cache hit rate
opa_cache_hits / (opa_cache_hits + opa_cache_misses)

# Average evaluation time
opa_evaluation_time_avg

# Error rate
opa_errors / opa_total_evaluations

# Admin actions per hour
rate(opa_admin_actions[1h])
```

## 🚨 **Alerting Rules**

### Critical Alerts
- **Service Down**: OPA service not responding
- **High Error Rate**: Error rate > 1%
- **Slow Performance**: Avg evaluation time > 100ms
- **Cache Issues**: Cache hit rate < 80%

### Warning Alerts
- **High Admin Activity**: Unusual admin access patterns
- **Rate Limit Hit**: Users hitting rate limits
- **Memory Usage**: High memory usage trends

## 🔒 **Security Best Practices**

### Policy Management
1. **Version Control**: Store policies in Git
2. **Code Review**: All policy changes require review
3. **Testing**: Comprehensive policy test suite
4. **Deployment**: Automated policy deployment pipeline

### Access Control
1. **Principle of Least Privilege**: Minimal required permissions
2. **Regular Audits**: Review user permissions quarterly
3. **Admin Monitoring**: Alert on all admin actions
4. **Session Management**: Proper token lifecycle management

### Compliance
1. **Audit Logging**: Complete access trail
2. **Data Protection**: Secure handling of user data
3. **Retention Policies**: Log retention per compliance requirements
4. **Incident Response**: Clear procedures for security incidents

## 🔄 **Maintenance Tasks**

### Daily
- Monitor service health and metrics
- Review error logs and failed access attempts
- Check system resource usage

### Weekly
- Review admin activity logs
- Analyze performance trends
- Update security patches

### Monthly
- Audit user permissions
- Review and update policies
- Performance optimization analysis
- Disaster recovery testing

### Quarterly
- Security audit and penetration testing
- Compliance review and documentation
- Capacity planning and scaling review
- Business continuity plan updates

## 📞 **Support and Troubleshooting**

### Common Issues

#### OPA Service Not Starting
```bash
# Check policy compilation
npm run compile-policies

# Verify WASM bundle
file dist/policies/bundle.tar.gz

# Check logs
tail -f logs/opa-service.log
```

#### Poor Performance
```bash
# Check metrics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/policies/metrics

# Clear cache if needed
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/policies/clear-cache
```

#### High Error Rate
```bash
# Check detailed status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/policies/status

# Review audit logs
grep "EVALUATION_ERROR" logs/audit.log
```

### Performance Tuning
1. **Increase cache size** for better hit rates
2. **Adjust TTL** based on policy change frequency
3. **Scale horizontally** with multiple OPA instances
4. **Use Redis** for distributed caching
5. **Optimize policies** to reduce evaluation complexity

## 🎯 **Next Steps**

1. **Set up monitoring** - Implement Prometheus/Grafana
2. **Configure alerting** - Set up PagerDuty/Slack alerts
3. **Policy CI/CD** - Automate policy testing and deployment
4. **Load testing** - Verify performance under load
5. **Security review** - External security audit
6. **Documentation** - Complete runbook and procedures
