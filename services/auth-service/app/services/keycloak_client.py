"""
Keycloak client integration for user management and SSO
"""
import logging
from typing import Optional, Dict, Any, List
from keycloak import KeycloakAdmin, KeycloakOpenID
from keycloak.exceptions import KeycloakError, KeycloakAuthenticationError, KeycloakGetError

logger = logging.getLogger(__name__)


class KeycloakClient:
    """Keycloak integration client"""
    
    def __init__(
        self,
        server_url: str,
        realm: str,
        client_id: str,
        client_secret: str,
        admin_username: str,
        admin_password: str
    ):
        self.server_url = server_url
        self.realm = realm
        self.client_id = client_id
        
        # Admin client for management
        try:
            self.admin_client = KeycloakAdmin(
                server_url=server_url,
                username=admin_username,
                password=admin_password,
                realm_name=realm,
                user_realm_name="master",
                verify=True
            )
            logger.info(f"Keycloak admin client initialized for realm: {realm}")
        except Exception as e:
            logger.error(f"Failed to initialize Keycloak admin client: {e}")
            self.admin_client = None
        
        # OpenID client for authentication
        try:
            self.openid_client = KeycloakOpenID(
                server_url=server_url,
                client_id=client_id,
                realm_name=realm,
                client_secret_key=client_secret
            )
            logger.info("Keycloak OpenID client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Keycloak OpenID client: {e}")
            self.openid_client = None
    
    async def create_user(
        self,
        email: str,
        username: str,
        password: str,
        first_name: str,
        last_name: str,
        role: str = "annotator"
    ) -> Optional[str]:
        """Create a new user in Keycloak"""
        try:
            user_data = {
                "email": email,
                "username": username,
                "firstName": first_name,
                "lastName": last_name,
                "enabled": True,
                "emailVerified": False,
                "credentials": [{
                    "type": "password",
                    "value": password,
                    "temporary": False
                }],
                "attributes": {
                    "role": [role]
                }
            }
            
            keycloak_id = self.admin_client.create_user(user_data)
            logger.info(f"User created in Keycloak: {username} ({keycloak_id})")
            return keycloak_id
            
        except KeycloakError as e:
            logger.error(f"Keycloak user creation error: {e}")
            return None
    
    async def get_user(self, keycloak_id: str) -> Optional[Dict[str, Any]]:
        """Get user details from Keycloak"""
        try:
            user = self.admin_client.get_user(keycloak_id)
            return user
        except KeycloakGetError as e:
            logger.error(f"Keycloak user retrieval error: {e}")
            return None
    
    async def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        try:
            users = self.admin_client.get_users({"username": username})
            if users and len(users) > 0:
                return users[0]
            return None
        except KeycloakGetError as e:
            logger.error(f"Keycloak user search error: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            users = self.admin_client.get_users({"email": email})
            if users and len(users) > 0:
                return users[0]
            return None
        except KeycloakGetError as e:
            logger.error(f"Keycloak user search error: {e}")
            return None
    
    async def update_user(self, keycloak_id: str, user_data: Dict[str, Any]) -> bool:
        """Update user in Keycloak"""
        try:
            self.admin_client.update_user(keycloak_id, user_data)
            logger.info(f"User updated in Keycloak: {keycloak_id}")
            return True
        except KeycloakError as e:
            logger.error(f"Keycloak user update error: {e}")
            return False
    
    async def delete_user(self, keycloak_id: str) -> bool:
        """Delete user from Keycloak"""
        try:
            self.admin_client.delete_user(keycloak_id)
            logger.info(f"User deleted from Keycloak: {keycloak_id}")
            return True
        except KeycloakError as e:
            logger.error(f"Keycloak user deletion error: {e}")
            return False
    
    async def reset_password(self, keycloak_id: str, new_password: str) -> bool:
        """Reset user password"""
        try:
            self.admin_client.set_user_password(
                keycloak_id,
                new_password,
                temporary=False
            )
            logger.info(f"Password reset for user: {keycloak_id}")
            return True
        except KeycloakError as e:
            logger.error(f"Keycloak password reset error: {e}")
            return False
    
    async def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user and get tokens"""
        try:
            token = self.openid_client.token(username, password)
            return {
                "access_token": token.get("access_token"),
                "refresh_token": token.get("refresh_token"),
                "expires_in": token.get("expires_in"),
                "refresh_expires_in": token.get("refresh_expires_in"),
                "token_type": token.get("token_type")
            }
        except KeycloakAuthenticationError as e:
            logger.error(f"Keycloak authentication error: {e}")
            return None
    
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh access token"""
        try:
            token = self.openid_client.refresh_token(refresh_token)
            return {
                "access_token": token.get("access_token"),
                "refresh_token": token.get("refresh_token"),
                "expires_in": token.get("expires_in"),
                "refresh_expires_in": token.get("refresh_expires_in")
            }
        except KeycloakError as e:
            logger.error(f"Keycloak token refresh error: {e}")
            return None
    
    async def logout(self, refresh_token: str) -> bool:
        """Logout user (revoke tokens)"""
        try:
            self.openid_client.logout(refresh_token)
            logger.info("User logged out successfully")
            return True
        except KeycloakError as e:
            logger.error(f"Keycloak logout error: {e}")
            return False
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            userinfo = self.openid_client.userinfo(token)
            return userinfo
        except KeycloakError as e:
            logger.error(f"Keycloak token verification error: {e}")
            return None
    
    async def introspect_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Introspect token (check if valid)"""
        try:
            token_info = self.openid_client.introspect(token)
            return token_info
        except KeycloakError as e:
            logger.error(f"Keycloak token introspection error: {e}")
            return None
    
    async def assign_role(self, keycloak_id: str, role_name: str) -> bool:
        """Assign role to user"""
        try:
            # Get realm roles
            roles = self.admin_client.get_realm_roles()
            role = next((r for r in roles if r['name'] == role_name), None)
            
            if role:
                self.admin_client.assign_realm_roles(
                    keycloak_id,
                    [role]
                )
                logger.info(f"Role {role_name} assigned to user: {keycloak_id}")
                return True
            else:
                logger.warning(f"Role not found: {role_name}")
                return False
        except KeycloakError as e:
            logger.error(f"Keycloak role assignment error: {e}")
            return False
    
    async def remove_role(self, keycloak_id: str, role_name: str) -> bool:
        """Remove role from user"""
        try:
            roles = self.admin_client.get_realm_roles()
            role = next((r for r in roles if r['name'] == role_name), None)
            
            if role:
                self.admin_client.delete_realm_roles_of_user(
                    keycloak_id,
                    [role]
                )
                logger.info(f"Role {role_name} removed from user: {keycloak_id}")
                return True
            else:
                logger.warning(f"Role not found: {role_name}")
                return False
        except KeycloakError as e:
            logger.error(f"Keycloak role removal error: {e}")
            return False
    
    async def get_user_roles(self, keycloak_id: str) -> List[str]:
        """Get user's roles"""
        try:
            roles = self.admin_client.get_realm_roles_of_user(keycloak_id)
            return [role['name'] for role in roles]
        except KeycloakError as e:
            logger.error(f"Keycloak get roles error: {e}")
            return []


# Global Keycloak client instance
keycloak_client: Optional[KeycloakClient] = None


def init_keycloak(
    server_url: str,
    realm: str,
    client_id: str,
    client_secret: str,
    admin_username: str,
    admin_password: str
):
    """Initialize Keycloak client"""
    global keycloak_client
    keycloak_client = KeycloakClient(
        server_url,
        realm,
        client_id,
        client_secret,
        admin_username,
        admin_password
    )
    logger.info("Keycloak client initialized")


def get_keycloak() -> KeycloakClient:
    """Get Keycloak client instance"""
    if keycloak_client is None:
        raise RuntimeError("Keycloak client not initialized")
    return keycloak_client

