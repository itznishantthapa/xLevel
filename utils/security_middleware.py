"""
🔐 Enhanced Security Middleware
Add this to your Django middleware stack for additional protection
"""

from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
import logging
import json
from datetime import datetime

logger = logging.getLogger('security')


class SecurityLoggingMiddleware(MiddlewareMixin):
    """Log all suspicious requests for security monitoring"""
    
    SUSPICIOUS_PATTERNS = [
        'admin//',
        '../',
        '..\\',
        '<script',
        'eval(',
        'exec(',
        'union select',
        'drop table',
        '/etc/passwd',
        'cmd.exe',
    ]
    
    def process_request(self, request):
        """Check for suspicious patterns in request"""
        path = request.path.lower()
        query = request.META.get('QUERY_STRING', '').lower()
        
        # Check for suspicious patterns
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern in path or pattern in query:
                logger.warning(
                    f'Suspicious request detected',
                    extra={
                        'ip': self.get_client_ip(request),
                        'path': request.path,
                        'query': request.META.get('QUERY_STRING'),
                        'user_agent': request.META.get('HTTP_USER_AGENT'),
                        'method': request.method,
                        'pattern': pattern,
                    }
                )
                return HttpResponse('Forbidden', status=403)
        
        return None
    
    @staticmethod
    def get_client_ip(request):
        """Get real client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RateLimitMiddleware(MiddlewareMixin):
    """Simple rate limiting middleware (use django-ratelimit for production)"""
    
    def process_request(self, request):
        """Implement basic rate limiting"""
        ip = SecurityLoggingMiddleware.get_client_ip(request)
        cache_key = f'rate_limit_{ip}'
        
        # Get current request count
        requests = cache.get(cache_key, 0)
        
        # Allow 100 requests per minute
        if requests > 100:
            logger.warning(
                f'Rate limit exceeded',
                extra={
                    'ip': ip,
                    'requests': requests,
                    'path': request.path,
                }
            )
            return HttpResponse('Too Many Requests', status=429)
        
        # Increment counter
        cache.set(cache_key, requests + 1, 60)  # Expire after 60 seconds
        
        return None


class IPWhitelistMiddleware(MiddlewareMixin):
    """Restrict admin access to whitelisted IPs"""
    
    ADMIN_WHITELIST = [
        '127.0.0.1',
        'localhost',
        # Add your trusted IPs here
    ]
    
    def process_request(self, request):
        """Check IP whitelist for admin pages"""
        if request.path.startswith('/admin/'):
            ip = SecurityLoggingMiddleware.get_client_ip(request)
            
            # Skip in development
            from django.conf import settings
            if settings.DEBUG:
                return None
            
            if ip not in self.ADMIN_WHITELIST:
                logger.warning(
                    f'Unauthorized admin access attempt',
                    extra={
                        'ip': ip,
                        'path': request.path,
                        'user': request.user if request.user.is_authenticated else 'Anonymous',
                    }
                )
                return HttpResponse('Forbidden', status=403)
        
        return None


class FileUploadValidationMiddleware(MiddlewareMixin):
    """Validate file uploads before processing"""
    
    ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def process_request(self, request):
        """Validate uploaded files"""
        if request.method == 'POST' and request.FILES:
            for field_name, uploaded_file in request.FILES.items():
                # Check file size
                if uploaded_file.size > self.MAX_FILE_SIZE:
                    logger.warning(
                        f'File too large: {uploaded_file.size} bytes',
                        extra={
                            'ip': SecurityLoggingMiddleware.get_client_ip(request),
                            'filename': uploaded_file.name,
                            'size': uploaded_file.size,
                        }
                    )
                    return HttpResponse('File too large', status=413)
                
                # Check file extension
                ext = uploaded_file.name.split('.')[-1].lower()
                if ext not in self.ALLOWED_EXTENSIONS:
                    logger.warning(
                        f'Invalid file type: {ext}',
                        extra={
                            'ip': SecurityLoggingMiddleware.get_client_ip(request),
                            'filename': uploaded_file.name,
                            'extension': ext,
                        }
                    )
                    return HttpResponse('Invalid file type', status=400)
        
        return None


# Add to settings.py:
# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'whitenoise.middleware.WhiteNoiseMiddleware',
#     'django.contrib.sessions.middleware.SessionMiddleware',
#     'corsheaders.middleware.CorsMiddleware',
#     'django.middleware.common.CommonMiddleware',
#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',
#     'django_otp.middleware.OTPMiddleware',
#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
#     
#     # Add these custom security middleware
#     'utils.security_middleware.SecurityLoggingMiddleware',
#     'utils.security_middleware.RateLimitMiddleware',
#     # 'utils.security_middleware.IPWhitelistMiddleware',  # Enable for admin IP restriction
#     'utils.security_middleware.FileUploadValidationMiddleware',
# ]
