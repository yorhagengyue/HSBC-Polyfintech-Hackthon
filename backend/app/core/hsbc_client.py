"""
HSBC Open Banking API Client
Implements OAuth 2.0 with private_key_jwt authentication and mTLS
"""

import asyncio
import json
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

import httpx
from jose import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cachetools import TTLCache
import logging

from .config import settings

logger = logging.getLogger(__name__)

class HSBCAPIError(Exception):
    """Custom exception for HSBC API errors"""
    def __init__(self, message: str, status_code: int = None, response_data: Dict = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)

class HSBCClient:
    """HSBC Open Banking API Client with OAuth 2.0 and mTLS support"""
    
    def __init__(self):
        self.client_id = settings.HSBC_CLIENT_ID
        self.kid = settings.HSBC_KID
        self.base_url = settings.HSBC_BASE_URL
        self.timeout = httpx.Timeout(30.0)
        self.org_id = settings.HSBC_ORGANIZATION_ID
        self.redirect_uri = settings.HSBC_REDIRECT_URI
        
        # Certificate paths
        self.transport_cert_path = settings.HSBC_TRANSPORT_CERT_PATH
        self.transport_key_path = settings.HSBC_TRANSPORT_KEY_PATH
        self.signing_cert_path = settings.HSBC_SIGNING_CERT_PATH
        self.signing_key_path = settings.HSBC_SIGNING_KEY_PATH
        
        # JWT settings
        self.jwt_algorithm = settings.JWT_ALGORITHM
        self.jwt_expiration_hours = settings.JWT_EXPIRATION_HOURS
        
        # Log configuration details
        logger.info("HSBC Client Configuration:")
        for key, value in [
            ('HSBC_CLIENT_ID', self.client_id),
            ('HSBC_KID', self.kid),
            ('HSBC_BASE_URL', self.base_url),
            ('HSBC_ORGANIZATION_ID', self.org_id),
            ('HSBC_REDIRECT_URI', self.redirect_uri),
            ('HSBC_TRANSPORT_CERT_PATH', self.transport_cert_path),
            ('HSBC_TRANSPORT_KEY_PATH', self.transport_key_path),
            ('HSBC_SIGNING_CERT_PATH', self.signing_cert_path),
            ('HSBC_SIGNING_KEY_PATH', self.signing_key_path)
        ]:
            logger.info(f"  {key}: {value}")
        
        # Token cache (60 minutes TTL)
        self.token_cache = TTLCache(maxsize=100, ttl=3600)
        self._http_client: Optional[httpx.AsyncClient] = None
        
        # Validate configuration
        self._validate_config()
    
    def _validate_config(self):
        """Validate HSBC API configuration"""
        required_settings = [
            ('HSBC_CLIENT_ID', self.client_id),
            ('HSBC_KID', self.kid),
            ('HSBC_BASE_URL', self.base_url),
        ]
        
        missing = [name for name, value in required_settings if not value]
        if missing:
            raise HSBCAPIError(f"Missing required HSBC configuration: {', '.join(missing)}")
        
        # Check certificate files exist
        cert_files = {
            'transport_cert': self.transport_cert_path,
            'transport_key': self.transport_key_path,
            'signing_key': self.signing_key_path,
        }
        
        for name, path in cert_files.items():
            if path and not Path(path).exists():
                logger.warning(f"HSBC certificate file not found: {name} at {path}")
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client with mTLS configuration"""
        if self._http_client is None:
            # mTLS configuration
            cert = None
            try:
                if self.transport_cert_path and self.transport_key_path:
                    cert_path = Path(self.transport_cert_path)
                    key_path = Path(self.transport_key_path)
                    
                    if cert_path.exists() and key_path.exists():
                        cert = (str(cert_path), str(key_path))
                        logger.info("mTLS certificates configured")
                    else:
                        logger.warning("mTLS certificate files not found, proceeding without mTLS")
            except Exception as e:
                logger.warning(f"mTLS configuration error: {e}, proceeding without mTLS")
                cert = None
            
            try:
                self._http_client = httpx.AsyncClient(
                    cert=cert,
                    timeout=httpx.Timeout(10.0),
                    limits=httpx.Limits(max_connections=20),
                    headers={
                        'User-Agent': 'Financial-Alarm-Clock/1.0',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                )
                logger.info(f"HTTP client created {'with' if cert else 'without'} mTLS")
            except Exception as e:
                # If mTLS fails, try without certificates
                logger.warning(f"mTLS authentication failed: {e}")
                logger.info("Attempting connection without certificates...")
                
                # Create a new client without certificates
                self._http_client = httpx.AsyncClient(
                    cert=None,
                    timeout=httpx.Timeout(10.0),
                    limits=httpx.Limits(max_connections=20),
                    headers={
                        'User-Agent': 'Financial-Alarm-Clock/1.0',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                )
                logger.info("HTTP client created without mTLS due to certificate issues")
        
        return self._http_client
    
    def _load_private_key(self, key_path: str):
        """Load private key for JWT signing"""
        try:
            with open(key_path, 'rb') as key_file:
                private_key = serialization.load_pem_private_key(
                    key_file.read(),
                    password=None
                )
            return private_key
        except Exception as e:
            raise HSBCAPIError(f"Failed to load private key from {key_path}: {str(e)}")
    
    def _generate_client_assertion(self) -> str:
        """Generate JWT client assertion for OAuth 2.0"""
        if not self.signing_key_path or not Path(self.signing_key_path).exists():
            raise HSBCAPIError("Signing private key not found for JWT generation")
        
        # Load private key as PEM string (fix for jose compatibility)
        try:
            with open(self.signing_key_path, 'r') as key_file:
                private_key_pem = key_file.read()
        except Exception as e:
            raise HSBCAPIError(f"Failed to read private key file: {str(e)}")
        
        # JWT payload
        now = int(time.time())
        payload = {
            'iss': self.client_id,  # Issuer
            'sub': self.client_id,  # Subject
            'aud': f"{self.base_url}/oauth2/token",  # Audience
            'jti': str(uuid.uuid4()),  # JWT ID
            'exp': now + 300,  # Expires in 5 minutes
            'iat': now,  # Issued at
        }
        
        # JWT header
        headers = {
            'kid': self.kid,  # Key ID from HSBC
            'alg': 'RS256',
            'typ': 'JWT'
        }
        
        # Generate JWT using PEM string
        try:
            token = jwt.encode(
                payload, 
                private_key_pem,  # Pass PEM string instead of cryptography object
                algorithm='RS256',
                headers=headers
            )
            logger.debug("Generated client assertion JWT")
            return token
        except Exception as e:
            raise HSBCAPIError(f"Failed to generate JWT: {str(e)}")
    
    async def _get_access_token(self) -> str:
        """Get or refresh OAuth 2.0 access token"""
        cache_key = f"hsbc_token_{self.client_id}"
        
        # Check cache first
        if cache_key in self.token_cache:
            logger.debug("Using cached access token")
            return self.token_cache[cache_key]
        
        # Generate new token
        client_assertion = self._generate_client_assertion()
        
        token_data = {
            'grant_type': 'client_credentials',
            'client_assertion_type': 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            'client_assertion': client_assertion,
            'scope': 'accounts balances transactions'  # Adjust scopes as needed
        }
        
        http_client = await self._get_http_client()
        
        try:
            response = await http_client.post(
                f"{self.base_url}/oauth2/token",
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HSBCAPIError(
                    f"OAuth token request failed: {response.status_code}",
                    status_code=response.status_code,
                    response_data=error_data
                )
            
            token_response = response.json()
            access_token = token_response.get('access_token')
            
            if not access_token:
                raise HSBCAPIError("No access token in OAuth response")
            
            # Cache token (with buffer for refresh)
            expires_in = token_response.get('expires_in', 3600)
            cache_ttl = max(expires_in - 120, 300)  # Refresh 2 minutes early, minimum 5 min
            
            self.token_cache[cache_key] = access_token
            logger.info(f"Retrieved new HSBC access token, expires in {expires_in}s")
            
            return access_token
            
        except httpx.RequestError as e:
            raise HSBCAPIError(f"Network error during OAuth: {str(e)}")
        except Exception as e:
            if isinstance(e, HSBCAPIError):
                raise
            raise HSBCAPIError(f"Unexpected error during OAuth: {str(e)}")
    
    async def _make_authenticated_request(
        self, 
        method: str, 
        endpoint: str, 
        **kwargs
    ) -> Dict[str, Any]:
        """Make authenticated request to HSBC API"""
        access_token = await self._get_access_token()
        http_client = await self._get_http_client()
        
        # Add authorization header
        headers = kwargs.pop('headers', {})
        headers.update({
            'Authorization': f'Bearer {access_token}',
            'x-fapi-financial-id': self.org_id or 'default',
            'x-fapi-interaction-id': str(uuid.uuid4())
        })
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = await http_client.request(
                method=method,
                url=url,
                headers=headers,
                **kwargs
            )
            
            if response.status_code == 401:
                # Token might be expired, clear cache and retry once
                cache_key = f"hsbc_token_{self.client_id}"
                self.token_cache.pop(cache_key, None)
                
                # Retry with fresh token
                access_token = await self._get_access_token()
                headers['Authorization'] = f'Bearer {access_token}'
                
                response = await http_client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    **kwargs
                )
            
            if not response.is_success:
                error_data = {}
                try:
                    error_data = response.json()
                except:
                    error_data = {'error': response.text}
                
                raise HSBCAPIError(
                    f"HSBC API error: {response.status_code} - {error_data.get('error', 'Unknown error')}",
                    status_code=response.status_code,
                    response_data=error_data
                )
            
            return response.json()
            
        except httpx.RequestError as e:
            raise HSBCAPIError(f"Network error: {str(e)}")
        except Exception as e:
            if isinstance(e, HSBCAPIError):
                raise
            raise HSBCAPIError(f"Unexpected error: {str(e)}")
    
    # Public API methods
    
    async def get_accounts(self) -> List[Dict[str, Any]]:
        """Get list of accounts"""
        try:
            response = await self._make_authenticated_request('GET', '/accounts')
            return response.get('Data', {}).get('Account', [])
        except HSBCAPIError:
            raise
        except Exception as e:
            raise HSBCAPIError(f"Failed to get accounts: {str(e)}")
    
    async def get_account_balances(self, account_id: str) -> Dict[str, Any]:
        """Get balances for specific account"""
        try:
            response = await self._make_authenticated_request('GET', f'/accounts/{account_id}/balances')
            return response.get('Data', {})
        except HSBCAPIError:
            raise
        except Exception as e:
            raise HSBCAPIError(f"Failed to get account balances: {str(e)}")
    
    async def get_transactions(
        self, 
        account_id: str, 
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get transactions for specific account"""
        try:
            params = {}
            if from_date:
                params['fromBookingDateTime'] = from_date.isoformat()
            if to_date:
                params['toBookingDateTime'] = to_date.isoformat()
            
            response = await self._make_authenticated_request(
                'GET', 
                f'/accounts/{account_id}/transactions',
                params=params
            )
            return response.get('Data', {}).get('Transaction', [])
        except HSBCAPIError:
            raise
        except Exception as e:
            raise HSBCAPIError(f"Failed to get transactions: {str(e)}")
    
    async def health_check(self) -> bool:
        """Check if HSBC API is accessible"""
        try:
            # Try to get accounts as a health check
            await self.get_accounts()
            return True
        except HSBCAPIError as e:
            logger.warning(f"HSBC API health check failed: {e.message}")
            # Check if it's a network error, suggest using mock mode
            if "Network error" in str(e.message) or "getaddrinfo failed" in str(e.message):
                logger.info("💡 Network connection issue, consider enabling HSBC mock mode for development testing")
            return False
        except Exception as e:
            logger.error(f"HSBC API health check error: {str(e)}")
            return False
    
    async def close(self):
        """Close HTTP client"""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None

# Global instance - choose between real client or mock client based on configuration
def get_hsbc_client():
    """Get HSBC client instance"""
    from .config import settings
    
    # Check if mock mode is enabled
    if settings.HSBC_MOCK_MODE:
        from .hsbc_mock import hsbc_mock_client
        logger.info("🎭 Using HSBC mock mode")
        return hsbc_mock_client
    else:
        logger.info("🏦 Using real HSBC API")
        return HSBCClient()

# Create global instance
hsbc_client = get_hsbc_client() 