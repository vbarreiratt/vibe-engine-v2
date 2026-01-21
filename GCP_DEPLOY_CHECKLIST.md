# ✅ GCP Credentials Deploy Checklist

## Pre-Deployment Verification

### 1. Local Code Verification
```bash
# Verify no hardcoded paths remain
grep -r "/Users/vbarreirat" app lib --include="*.ts" --include="*.tsx"
# Expected: No results
```

### 2. Environment File Check
```bash
# Verify .env on VPS has correct path
cat /home/vitor/apps/vibe-engine-v2/.env | grep GOOGLE_CLOUD_CREDENTIALS_PATH
# Expected: GOOGLE_CLOUD_CREDENTIALS_PATH=/app/gcp-service-account.json
```

### 3. Service Account File Check
```bash
# Verify service account file exists on VPS
ls -la /home/vitor/apps/secrets/vibe-engine-v2/gcp-service-account.json
# Expected: -rw-r--r-- 1 vitor vitor <size> <date> gcp-service-account.json
```

## Post-Deployment Verification (After `docker-compose up`)

### 4. Container Environment Check
```bash
# SSH into VPS and run:
docker exec -it vibe-engine sh -c 'printenv | grep GOOGLE'

# Expected output:
# GOOGLE_CLOUD_CREDENTIALS_PATH=/app/gcp-service-account.json
# GOOGLE_CLOUD_PROJECT_ID=<your-project-id>
# GOOGLE_CLOUD_LOCATION=us-central1
```

### 5. Volume Mount Verification
```bash
# Verify file is mounted inside container
docker exec -it vibe-engine sh -c 'ls -la /app/gcp-service-account.json'

# Expected output:
# -r--r--r-- 1 root root <size> <date> /app/gcp-service-account.json
# (note: read-only mount indicated by -r--r--r--)
```

### 6. File Content Verification (Optional)
```bash
# Verify JSON is valid inside container
docker exec -it vibe-engine sh -c 'head -c 100 /app/gcp-service-account.json'

# Expected: Should start with {
#   "type": "service_account",
#   "project_id": "...
```

### 7. Application Health Check
```bash
# Check container logs for GCP errors
docker logs vibe-engine --tail 50 | grep -i "gcp\|google\|credentials"

# Expected: No ENOENT errors or "Missing GOOGLE_CLOUD_CREDENTIALS_PATH"
```

### 8. Functional Test
```bash
# Test embedding generation endpoint (if available)
# Or trigger any feature that uses Vertex AI
# Monitor logs for successful API calls to Vertex AI
docker logs vibe-engine -f
```

## Troubleshooting

### Issue: `ENOENT: no such file or directory`
**Cause**: File not mounted or wrong path

**Solution**:
```bash
# 1. Check docker-compose.yml has correct volume mount
cat docker-compose.yml | grep -A 3 volumes

# 2. Verify host file exists
ls -la /home/vitor/apps/secrets/vibe-engine-v2/gcp-service-account.json

# 3. Recreate container
docker-compose down
docker-compose up -d
```

### Issue: `Missing GOOGLE_CLOUD_CREDENTIALS_PATH`
**Cause**: Environment variable not set

**Solution**:
```bash
# 1. Add to .env file
echo "GOOGLE_CLOUD_CREDENTIALS_PATH=/app/gcp-service-account.json" >> .env

# 2. Restart container
docker-compose restart
```

### Issue: `Failed to read or parse credentials`
**Cause**: Invalid JSON or permissions issue

**Solution**:
```bash
# 1. Validate JSON on host
cat /home/vitor/apps/secrets/vibe-engine-v2/gcp-service-account.json | jq .

# 2. Check file permissions
chmod 644 /home/vitor/apps/secrets/vibe-engine-v2/gcp-service-account.json
```

### Issue: Application works but Vertex AI calls fail
**Cause**: Service account lacks proper permissions

**Solution**:
1. Go to Google Cloud Console
2. IAM & Admin → Service Accounts
3. Find your service account
4. Grant roles:
   - Vertex AI User
   - Service Account Token Creator

## Success Criteria

- [ ] `grep -r "/Users/vbarreirat"` returns nothing
- [ ] Environment variable `GOOGLE_CLOUD_CREDENTIALS_PATH` is set in container
- [ ] File `/app/gcp-service-account.json` exists in container (read-only)
- [ ] No ENOENT errors in logs
- [ ] Vertex AI features work (embedding, captioning, signal extraction)
- [ ] Container starts without GCP-related errors

## Rollback Plan

If issues persist:

```bash
# 1. Stop container
docker-compose down

# 2. Fix credentials or env configuration

# 3. Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# 4. Monitor logs
docker logs vibe-engine -f
```

---

**Last Updated**: 2026-01-20
**Commit**: b00baa3 (fix(gcp): remove local service account paths)
